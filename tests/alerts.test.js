// `alerts create` / `alerts edit` send what the server's alerts_create / alerts_edit schema takes:
// the five Hyperliquid types, a transfer alert's address, and no default chain (a Hyperliquid
// alert refuses one). fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerAlerts } from '../src/commands/alerts.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

async function run(args) {
  vi.stubEnv('VIKE_API_KEY', 'vk_test');
  vi.stubEnv('VIKE_MCP_URL', 'https://mcp.invalid/mcp');
  const fetchMock = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({
      jsonrpc: '2.0', id: 1,
      result: { content: [{ type: 'text', text: '{"alert": {"id": 1}}' }], isError: false },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const program = new Command();
  registerAlerts(program);
  await program.parseAsync(['node', 'vike-data', 'alerts', ...args, '--json']);
  return JSON.parse(fetchMock.mock.calls[0][1].body).params;
}

const WALLET = '0x1111111111111111111111111111111111111111';

describe('alerts create', () => {
  it('a Hyperliquid cohort-bias alert: its parameters, and no chain', async () => {
    const p = await run([
      'create', '--label', 'BTC smart flip', '--type', 'hl_cohort_bias', '--token', 'BTC',
      '--index', 'smi', '--threshold', '0.2', '--band', '0.05', '--direction', 'up', '--channel', 'webhook',
    ]);
    expect(p.name).toBe('alerts_create');
    expect(p.arguments).toMatchObject({
      label: 'BTC smart flip', alert_type: 'hl_cohort_bias', token_symbol: 'BTC',
      index: 'smi', threshold: '0.2', band: '0.05', direction: 'up', channels: ['webhook'],
    });
    expect(p.arguments).not.toHaveProperty('chain');
    expect(p.arguments).not.toHaveProperty('address');
  });

  it('a cohort-fill alert takes cohort lists with spaces in the names', async () => {
    const p = await run([
      'create', '--label', 'smart fills', '--type', 'hl_cohort_fill', '--min-usd', '10000',
      '--pnl-cohorts', '3x smart', '2x smart', '--size-cohorts', '4x whale',
    ]);
    expect(p.arguments).toMatchObject({
      alert_type: 'hl_cohort_fill', min_value_usd: '10000',
      pnl_cohorts: ['3x smart', '2x smart'], size_cohorts: ['4x whale'],
    });
  });

  it('a wallet alert: wallet and actions', async () => {
    const p = await run(['create', '--label', 'w', '--type', 'hl_wallet', '--wallet', WALLET, '--actions', 'open', 'flip']);
    expect(p.arguments).toMatchObject({ alert_type: 'hl_wallet', wallet: WALLET, actions: ['open', 'flip'] });
  });

  it('a transfer alert on one address, on base', async () => {
    const p = await run([
      'create', '--label', 'USDC in', '--token', 'USDC', '--chain', 'base',
      '--address', WALLET, '--address-role', 'to', '--min-usd', '1000000', '--channel', 'email',
    ]);
    expect(p.arguments).toMatchObject({
      label: 'USDC in', token_symbol: 'USDC', chain: 'base', address: WALLET, address_role: 'to',
      min_value_usd: '1000000', channels: ['email'], cooldown_minutes: 60,
    });
    expect(p.arguments).not.toHaveProperty('alert_type');      // the server's default, transfer
  });
});

describe('alerts edit', () => {
  it('sends only the fields given', async () => {
    const p = await run(['edit', '7', '--actions', 'open', 'close', '--band', '0.2']);
    expect(p.name).toBe('alerts_edit');
    expect(p.arguments).toEqual({ alert_id: '7', actions: ['open', 'close'], band: '0.2' });
  });
});

describe('alerts edit clears a list with \'\'', () => {
  it('sends [] for --pnl-cohorts \'\', --actions \'\' and --channel \'\'', async () => {
    const p = await run(['edit', '9', '--pnl-cohorts', '', '--actions', '', '--channel', '']);
    expect(p.arguments).toEqual({ alert_id: '9', pnl_cohorts: [], actions: [], channels: [] });
  });
});

describe('the new alert commands', () => {
  it.each([
    [['events', '--limit', '50', '--rule-id', '3'], 'alerts_events', { limit: '50', rule_id: '3' }],
    [['resend', '42'], 'alerts_resend_delivery', { delivery_id: '42' }],
    [['rotate-secret', '5'], 'alerts_rotate_webhook_secret', { channel_id: '5' }],
    [['test-webhook', '5'], 'alerts_test_webhook', { channel_id: '5' }],
  ])('alerts %s', async (args, tool, expected) => {
    const p = await run(args);
    expect(p.name).toBe(tool);
    expect(p.arguments).toEqual(expected);
  });
});
