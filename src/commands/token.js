import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';

export function registerToken(program) {
  const cmd = program
    .command('token')
    .description('Token search, transfers, screener and holders');

  cmd
    .command('search <query>')
    .description('Search tokens by symbol or name')
    .option('--chain <chain>', 'ethereum | bsc | base', 'ethereum')
    .option('--limit <n>', 'Max results', '10')
    .option('--json', 'Emit JSON')
    .action(async (query, opts) => {
      try {
        const r = await callTool('token_search', {
          query,
          chain: opts.chain,
          limit: parseInt10(opts.limit, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('transfers <token_address>')
    .description('Top buyers/sellers for a token in a window')
    .option('--period <p>', '1h | 24h | 7d | 30d', '24h')
    .option('--tab <t>', 'bought | sold', 'sold')
    .option('--chain <chain>', 'ethereum | bsc | base | all', 'ethereum')
    .option('--json', 'Emit JSON')
    .action(async (tokenAddress, opts) => {
      try {
        const r = await callTool('token_transfers', {
          token_address: tokenAddress,
          period: opts.period,
          tab: opts.tab,
          chain: opts.chain,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('screener')
    .description('Token discovery filter — rank tokens by volume / inflow / holders / smart-money inflow')
    .option('--chain <c>', 'ethereum | bsc | base', 'ethereum')
    .option('--window <w>', '24h | 7d | 30d | 90d', '24h')
    .option('--sort <s>', 'volume | net_inflow | holders | smart_inflow', 'volume')
    .option('--limit <n>', 'Max tokens (max 100)', '20')
    .option('--min-volume <usd>', 'Minimum window volume USD', '0')
    .option('--min-holders <n>', 'Minimum unique holders', '0')
    .option('--smart-money-only', 'Restrict flows to smart-money cohort')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('token_screener', {
          chain: opts.chain,
          window: opts.window,
          sort: opts.sort,
          limit: parseInt10(opts.limit, 20),
          min_volume_usd: parseFloat(opts.minVolume) || 0,
          min_holders: parseInt10(opts.minHolders, 0),
          smart_money_only: Boolean(opts.smartMoneyOnly),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('holders <token_address>')
    .description('Top holders of a token by cumulative net inflow USD')
    .option('--chain <chain>', 'ethereum | bsc | base', 'ethereum')
    .option('--limit <n>', 'Max holders (max 50)', '10')
    .option('--json', 'Emit JSON')
    .action(async (tokenAddress, opts) => {
      try {
        const r = await callTool('token_holders', {
          token_address: tokenAddress,
          chain: opts.chain,
          limit: parseInt10(opts.limit, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });
}
