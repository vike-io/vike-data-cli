import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseBool, parseInt10 } from '../util.js';
import { addTool } from './tool-command.js';

// What a rule watches beyond token and USD bounds: a transfer alert's address, and the Hyperliquid
// parameters. Which alert type takes which is the server's to check; it names the fix.
const TARGET_OPTIONS = [
  ['--address <a>', 'transfer: one wallet to watch (0x + 40 hex), sent or received'],
  ['--address-role <r>', 'transfer: any | from | to (default any; needs --address)'],
  ['--wallet <a>', 'Hyperliquid account (0x + 40 hex): required by hl_wallet and hl_liq_proximity, optional for hl_liquidation'],
  ['--actions <a...>', 'hl_wallet: open close flip increase reduce (default all but reduce)'],
  ['--pnl-cohorts <c...>', 'hl_cohort_fill, hl_liquidation: PnL cohorts, e.g. "3x smart" "2x smart"'],
  ['--size-cohorts <c...>', 'hl_cohort_fill, hl_liquidation: size cohorts, e.g. "4x whale" whale'],
  ['--index <i>', 'hl_cohort_bias (required): smi | wsi | smart_bias | whale_bias | smi_wsi_gap'],
  ['--threshold <n>', 'hl_cohort_bias: level to cross (default 0); hl_liq_proximity: share of the way to liquidation, 0-1 (default 0.8)'],
  ['--band <n>', 'hl_cohort_bias, hl_liq_proximity: hysteresis, > 0 (default 0.1)'],
  ['--direction <d>', 'hl_cohort_bias: up | down | both (default both)'],
];

function targetArgs(opts) {
  return {
    address: opts.address,
    address_role: opts.addressRole,
    wallet: opts.wallet,
    actions: opts.actions,
    pnl_cohorts: opts.pnlCohorts,
    size_cohorts: opts.sizeCohorts,
    index: opts.index,
    threshold: opts.threshold,
    band: opts.band,
    direction: opts.direction,
  };
}

export function registerAlerts(program) {
  const cmd = program
    .command('alerts')
    .description('Manage alerts: on-chain transfers and Hyperliquid fills, liquidations, cohort bias and liquidation proximity');

  cmd
    .command('list')
    .description('List your alerts')
    .option('--include-inactive', 'Include paused/deleted alerts')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('alerts_list', {
          include_inactive: parseBool(opts.includeInactive, false),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('register-webhook <url>')
    .description('Register an HTTPS webhook for alert delivery (HMAC-signed POST when secret given)')
    .option('--secret <s>', 'Optional HMAC-SHA256 secret (recommended, >=16 chars)')
    .option('--json', 'Emit JSON')
    .action(async (url, opts) => {
      try {
        const r = await callTool('alerts_register_webhook', {
          url,
          secret: opts.secret,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('channels')
    .description('List your enabled notification channels (email/webhook)')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('alerts_list_channels', {});
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  const create = cmd
    .command('create')
    .description('Create an alert: an on-chain transfer alert (default) or a Hyperliquid alert (--type)')
    .requiredOption('--label <l>', 'Alert label (user-visible name)')
    .option('--type <t>', 'transfer | hl_wallet | hl_cohort_fill | hl_liquidation | hl_cohort_bias | hl_liq_proximity (default transfer)')
    .option('--token <sym>', 'transfer: token ticker, UPPERCASE (e.g. USDC); Hyperliquid: the coin (BTC, kPEPE), required by hl_cohort_bias')
    // No default chain: a Hyperliquid alert refuses one.
    .option('--chain <c>', 'transfer only: eth | bsc | base | hyperevm (default eth)')
    .option('--min-usd <n>', 'transfer: minimum USD value; Hyperliquid: fill or liquidation floor (hl_cohort_fill: required, >= 10000)')
    .option('--max-usd <n>', 'transfer only: maximum USD value');
  for (const [flags, text] of TARGET_OPTIONS) create.option(flags, text);
  create
    .option('--channel <c...>', 'Notification channel(s): email, webhook (Hyperliquid: webhook, or none and read them with `alerts events`)')
    .option('--cooldown <min>', 'Token-wide transfer alerts: minimum gap between notifications (minutes)', '60')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('alerts_create', {
          label: opts.label,
          alert_type: opts.type,
          token_symbol: opts.token,
          chain: opts.chain,
          min_value_usd: opts.minUsd,
          max_value_usd: opts.maxUsd,
          ...targetArgs(opts),
          channels: opts.channel,
          cooldown_minutes: parseInt10(opts.cooldown, 60),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  const edit = cmd
    .command('edit <alert_id>')
    .description('Update an alert (only fields you pass are modified; \'\' clears an optional one)')
    .option('--label <l>')
    .option('--token <sym>')
    .option('--chain <c>')
    .option('--min-usd <n>')
    .option('--max-usd <n>');
  for (const [flags, text] of TARGET_OPTIONS) edit.option(flags, text);
  edit
    .option('--channel <c...>')
    .option('--cooldown <min>')
    .option('--active <bool>', 'Pause/resume (true|false)')
    .option('--json', 'Emit JSON')
    .action(async (alertId, opts) => {
      try {
        const payload = { alert_id: alertId, ...targetArgs(opts) };
        if (opts.label !== undefined) payload.label = opts.label;
        if (opts.token !== undefined) payload.token_symbol = opts.token;
        if (opts.chain !== undefined) payload.chain = opts.chain;
        if (opts.minUsd !== undefined) payload.min_value_usd = opts.minUsd;
        if (opts.maxUsd !== undefined) payload.max_value_usd = opts.maxUsd;
        if (opts.channel !== undefined) payload.channels = opts.channel;
        if (opts.cooldown !== undefined) payload.cooldown_minutes = opts.cooldown;
        if (opts.active !== undefined) payload.is_active = parseBool(opts.active, true);
        const r = await callTool('alerts_edit', payload);
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('delete <alert_id>')
    .description('Delete (or pause) an alert')
    .option('--hard', 'Hard-delete instead of pausing')
    .option('--json', 'Emit JSON')
    .action(async (alertId, opts) => {
      try {
        const r = await callTool('alerts_delete', {
          alert_id: alertId,
          hard: parseBool(opts.hard, false),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  addTool(cmd, 'events', {
    tool: 'alerts_events',
    desc: 'Events your alerts produced, oldest first, with each delivery\'s status (kept 15 days)',
    options: [
      ['--cursor <c>', 'next_cursor from the previous page (an empty page returns the same one)'],
      ['--limit <n>', 'Events per page, 1-500 (default 100)'],
      ['--rule-id <id>', 'Only the events of this alert'],
    ],
  });

  addTool(cmd, 'resend <delivery_id>', {
    tool: 'alerts_resend_delivery',
    args: ['delivery_id'],
    desc: 'Send one delivery again (its id from an event\'s delivery list in `alerts events`)',
  });

  addTool(cmd, 'rotate-secret <channel_id>', {
    tool: 'alerts_rotate_webhook_secret',
    args: ['channel_id'],
    desc: 'New signing secret for a webhook channel; the old one keeps signing for 24 hours',
  });

  addTool(cmd, 'test-webhook <channel_id>', {
    tool: 'alerts_test_webhook',
    args: ['channel_id'],
    desc: 'Send the signed test event to a webhook channel again',
  });
}
