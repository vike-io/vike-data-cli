import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';

export function registerWallet(program) {
  const cmd = program
    .command('wallet')
    .description('Wallet metrics, discovery, and ranking');

  cmd
    .command('summary <address>')
    .description('Aggregate metrics: volume / inflow / outflow / net flow / tx count across 24h-all windows')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_summary', { address });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('transactions <address>')
    .alias('txs')
    .description('Raw per-wallet transfer list with filters')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--direction <d>', 'in | out | all', 'all')
    .option('--days <n>', 'Days back (max 365)', '30')
    .option('--limit <n>', 'Max txs (max 500)', '50')
    .option('--min-usd <n>', 'Filter dust below this USD value', '0')
    .option('--token <addr>', 'Optional: restrict to one token address')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_transactions', {
          address,
          chain: opts.chain,
          direction: opts.direction,
          days: parseInt10(opts.days, 30),
          limit: parseInt10(opts.limit, 50),
          min_usd: parseFloat(opts.minUsd) || 0,
          token_address: opts.token,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('compare <address_a> <address_b>')
    .description('Diff two wallets — shared counterparties + shared tokens')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--window <w>', '24h | 7d | 30d | 90d | 180d | all', '30d')
    .option('--limit <n>', 'Max shared items per category (max 50)', '10')
    .option('--json', 'Emit JSON')
    .action(async (a, b, opts) => {
      try {
        const r = await callTool('wallet_compare', {
          address_a: a, address_b: b,
          chain: opts.chain, window: opts.window,
          limit: parseInt10(opts.limit, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('trace <address>')
    .description('Counterparty graph traversal from a root wallet')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--depth <n>', 'Hops to follow (1-5)', '2')
    .option('--width <n>', 'Top counterparties per hop (1-10)', '5')
    .option('--window <w>', '24h | 7d | 30d | 90d | all', '30d')
    .option('--min-usd <n>', 'Minimum USD per transfer to follow', '10000')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_trace', {
          address,
          chain: opts.chain,
          depth: parseInt10(opts.depth, 2),
          width: parseInt10(opts.width, 5),
          window: opts.window,
          min_usd: parseFloat(opts.minUsd) || 10000,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('batch <addresses...>')
    .description('Bulk label + 30d summary lookup for many addresses (max 100)')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--json', 'Emit JSON')
    .action(async (addresses, opts) => {
      try {
        const r = await callTool('wallet_batch_labels', {
          addresses, chain: opts.chain,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('counterparties <address>')
    .description('Top trading partners of a wallet by combined transfer volume')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--window <w>', '24h | 7d | 30d | 90d | 180d | all', '30d')
    .option('--limit <n>', 'Max counterparties returned (default 10, max 50)', '10')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_counterparties', {
          address,
          chain: opts.chain,
          window: opts.window,
          limit: parseInt10(opts.limit, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('pnl-history <address>')
    .description('Daily net-flow series (proxy for daily PnL)')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--days <n>', 'Days back (max 365)', '30')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_pnl_history', {
          address,
          chain: opts.chain,
          days: parseInt10(opts.days, 30),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('balances <address>')
    .description('Current token holdings, read from the chain, on the chains the server scans')
    .option('--chains <list>', 'Comma-separated chain names to scan (default: all the server scans; see `vike-data schema --pretty`)')
    .option('--min-usd <n>', 'Filter dust below this USD value (default $1; recommend $100+ for noisy wallets)', '1')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const payload = { address, min_usd: opts.minUsd };
        if (opts.chains) {
          payload.chains = opts.chains.split(',').map((c) => c.trim()).filter(Boolean);
        }
        const r = await callTool('wallet_token_balances', payload);
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('ens <address>')
    .description('Reverse ENS lookup: address → vitalik.eth style name')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_ens', { address });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('discover')
    .description('Top wallets ranked by volume / inflow / outflow / pnl / net_flow / tx_count')
    .option('--window <w>', '24h | 7d | 30d | 90d | all', '30d')
    .option('--sort <s>', 'volume | inflow | outflow | net_flow | tx_count | pnl', 'volume')
    .option('--order <o>', 'asc | desc', 'desc')
    .option('--chain <c>', 'ethereum | bsc', 'ethereum')
    .option('--size <n>', 'Page size (max 20)', '10')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('wallet_discover', {
          window: opts.window,
          sort: opts.sort,
          order: opts.order,
          chain: opts.chain,
          size: parseInt10(opts.size, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });
}
