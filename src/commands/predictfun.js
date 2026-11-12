import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { addTool } from './tool-command.js';

export function registerPredictfun(program) {
  const cmd = program
    .command('predictfun')
    .alias('pf')
    .description('Predict.fun prediction markets on BNB Chain (overview, markets, order books, on-chain fills, wallet positions and P&L, leaderboard)');

  addTool(cmd, 'overview', {
    tool: 'predictfun_overview',
    desc: 'Open markets, and 24h USD volume, matches and wallets (whole fill hours, rebuilt hourly)',
  });

  cmd
    .command('markets')
    .description('Predict.fun markets with 24h volume, matches and wallets, largest volume first (or newest)')
    .option('--status <s>', 'open | closed | resolved (default all)')
    .option('--query <q>', 'Case-insensitive substring of the title or question')
    .option('--sort <s>', 'volume_24h (default) | newest; a cursor works only with its own sort')
    .option('--limit <n>', 'Rows per page (default 20, max 100)')
    .option('--cursor <c>', 'next_cursor from the previous page')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('predictfun_markets', {
          status: opts.status,
          q: opts.query,
          sort: opts.sort,
          limit: opts.limit,
          cursor: opts.cursor,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  addTool(cmd, 'market <market_id>', {
    tool: 'predictfun_market_detail',
    args: ['market_id'],
    desc: 'One market by market_id: the market, its outcomes (token ids, WON/LOST, last price) and 24h and total stats',
  });

  addTool(cmd, 'orderbook <market_id>', {
    tool: 'predictfun_market_book',
    args: ['market_id'],
    desc: 'Newest recorded order book of one market, priced on its first outcome (Yes); an error when none in 30 days',
  });

  const CURSOR = ['--cursor <c>', 'next_cursor from the previous page'];
  const LIMIT = ['--limit <n>', 'Rows per page (default 100, max 10000)'];

  addTool(cmd, 'market-trades <market_id>', {
    tool: 'predictfun_market_trades',
    args: ['market_id'],
    desc: 'One market\'s on-chain fills with the wallet behind each, newest first (one row = one order\'s fill)',
    options: [LIMIT, CURSOR],
  });

  addTool(cmd, 'wallet <address>', {
    tool: 'predictfun_wallet_positions',
    args: ['address'],
    desc: 'One wallet\'s positions and P&L per outcome token, with realized and unrealized totals (exchange fills only)',
  });

  addTool(cmd, 'wallet-trades <address>', {
    tool: 'predictfun_wallet_trades',
    args: ['address'],
    desc: 'One wallet\'s on-chain fills with their market and outcome, newest first (one row = one order\'s fill)',
    options: [LIMIT, CURSOR],
  });

  addTool(cmd, 'wallet-flows <address>', {
    tool: 'predictfun_wallet_flows',
    args: ['address'],
    desc: 'One wallet\'s USDT deposits and withdrawals on BNB Chain, newest first, with whole-history totals and the first funder',
    options: [LIMIT, CURSOR],
  });

  addTool(cmd, 'leaderboard', {
    tool: 'predictfun_leaderboard',
    desc: 'Every wallet ranked by realized P&L, volume or fills over a window, or by unrealized P&L (rebuilt hourly)',
    options: [
      ['--window <w>', 'all (default) | 1d | 7d | 30d'],
      ['--sort <s>', 'realized (default) | volume | fills | unrealized (--window all only)'],
      ['--limit <n>', 'Rows per page (default 20, max 50)'],
      ['--offset <n>', 'Rows to skip, 0-1000'],
    ],
  });
}
