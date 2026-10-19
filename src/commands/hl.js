import { addTool } from './tool-command.js';

// One subcommand per Hyperliquid MCP tool. `hl_perp_top_traders` and `hl_position_match` stay
// under `perp`, candles under `candles`. Flags carry the tool's own parameter names.
const VIEW = '--view <v>';
const OPENED = ['--opened-within <w>', '24h | 7d | 30d | all'];
const LABEL = ['--label-basis <b>', 'current | point_in_time (point_in_time for any backtest)'];
const CURSOR = ['--cursor <c>', 'nextCursor from the previous page, verbatim'];
const START = ['--start <t>', 'ISO-8601 UTC lower bound'];
const END = ['--end <t>', 'ISO-8601 UTC upper bound'];

export function registerHl(program) {
  const hl = program
    .command('hl')
    .description('Hyperliquid: cohort positioning, wallets, leaderboards, liquidations, market structure, builders');

  addTool(hl, 'cohort-metrics', {
    tool: 'hl_cohort_metrics',
    arg: 'symbol',
    desc: 'Hourly long/short notional per wallet cohort for one symbol (are whales / smart money long or short)',
    options: [
      ['--axis <a>', 'size | pnl | pnl_abs | tier | pnl_unrealized (default size)'],
      ['--hours <n>', 'Hourly buckets, newest first, max 8760 (default 168; use 1-24 for a current read)'],
      START, END, OPENED, LABEL,
      ['--grading <g>', 'realized | realized-pit | unrealized (pnl axes only)'],
      CURSOR,
    ],
    ints: ['hours'],
  });

  addTool(hl, 'segments', {
    tool: 'hl_segments',
    desc: 'Cohort vocabulary and positioning at the latest snapshot',
    options: [
      [VIEW, 'segments | cohorts | summary | heatmap (default segments)'],
      ['--cohort <c>', 'One label, e.g. whale or "3x smart" (required by summary)'],
      ['--axis <a>', 'size | pnl | pnl_abs'],
      OPENED,
    ],
  });

  addTool(hl, 'wallet', {
    tool: 'hl_wallet',
    arg: 'address',
    desc: 'One Hyperliquid wallet: equity, open positions, cohorts, lifetime PnL, risk metrics (or a trade summary)',
    options: [
      [VIEW, 'summary | trades_summary (default summary)'],
      ['--window <w>', '1d | 7d | 30d | all (default all)'],
      OPENED,
    ],
  });

  addTool(hl, 'activity', {
    tool: 'hl_wallet_activity',
    arg: 'address',
    desc: 'A wallet\'s fills, funding, ledger (deposits, withdrawals, sends) or builder-code routing',
    options: [
      [VIEW, 'fills | funding | ledger | builders (default fills)'],
      ['--symbol <s>', 'One symbol (fills, funding)'],
      START, END,
      ['--side <s>', 'buy | sell (fills only)'],
      ['--limit <n>', 'Rows per page (default 100, max 5000; builders 50, max 500)'],
      CURSOR,
      ['--event-type <t>', 'One ledger event type (ledger only)'],
      ['--window <w>', '1d | 7d | 30d | all (builders only)'],
    ],
    ints: ['limit'],
  });

  addTool(hl, 'leaderboard', {
    tool: 'hl_leaderboard',
    desc: 'Rank wallets with the full risk set (Calmar, profit factor, streaks), or flow-adjusted (excludes deposits)',
    options: [
      [VIEW, 'ranking | flow_adjusted (default ranking)'],
      ['--window <w>', '1d | 7d | 30d | all (default 30d)'],
      ['--sort <s>', 'One of 20 keys (ranking only); an unknown key is refused'],
      ['--order <o>', 'asc | desc'],
      ['--cohort <c>', 'Filter to one cohort label on --axis (ranking only)'],
      ['--axis <a>', 'size | pnl | pnl_abs: the ladder --cohort filters on'],
      ['--min-trades <n>', 'Minimum closed trades (ranking only; no floor at 0)'],
      ['--min-win-rate <f>', 'FRACTION 0-1 (0.6 is 60%), unlike perp top-traders'],
      ['--min-volume <usd>', 'Minimum total volume in USD'],
      ['--limit <n>', 'Rows per page (default 25, max 500)'],
      CURSOR,
    ],
    ints: ['minTrades', 'limit'],
    nums: ['minWinRate', 'minVolume'],
  });

  addTool(hl, 'liquidations', {
    tool: 'hl_liquidations',
    desc: 'Realized liquidations, positions near liquidation per symbol, or a liquidation-price heatmap of one symbol',
    options: [
      [VIEW, 'fills | risk | heatmap (default fills)'],
      ['--symbol <s>', 'One symbol (optional on fills, required by heatmap)'],
      ['--wallet <a>', 'Has this wallet been liquidated (fills only)'],
      START, END,
      ['--direction <d>', 'long | short: the side of the position that was closed (fills only)'],
      ['--limit <n>', 'Rows per page (fills max 5000, risk max 500)'],
      CURSOR,
      ['--axis <a>', 'size | pnl | pnl_abs (risk only)'],
      ['--cohort <c>', 'One label on --axis (risk only)'],
      ['--bins <n>', 'Equal-width price bins, 5-500 (heatmap only)'],
    ],
    ints: ['limit', 'bins'],
  });

  addTool(hl, 'market', {
    tool: 'hl_market',
    desc: 'Open interest per symbol, one symbol\'s hourly series, its size breakdown, or individual open positions',
    options: [
      [VIEW, 'open_interest | symbol_metrics | size_breakdown | positions (default open_interest)'],
      ['--symbol <s>', 'One symbol (required by symbol_metrics, size_breakdown; always pass it on positions)'],
      START, END,
      ['--axis <a>', 'size | pnl | pnl_abs'],
      ['--cohort <c>', 'One label on --axis (symbol_metrics, positions)'],
      OPENED,
      ['--limit <n>', 'Rows per page (max 5000; positions default 100)'],
      CURSOR,
      ['--label-basis <b>', 'current only (symbol_metrics)'],
      ['--wallet <a>', 'One wallet\'s positions (positions only)'],
    ],
    ints: ['limit'],
  });

  addTool(hl, 'builders', {
    tool: 'hl_builders',
    desc: 'Builder codes (front-ends and bots paid a slice of the taker fee): leaderboard, stats, profile, users, fills, series',
    options: [
      [VIEW, 'leaderboard | stats | profile | users | fills | series (default leaderboard)'],
      ['--window <w>', '1d | 7d | 30d | all (default 30d)'],
      ['--sort <s>', 'leaderboard: fee | volume | users | fills. users: volume | fees | pnl'],
      ['--order <o>', 'asc | desc'],
      ['--limit <n>', 'Rows per page; caps: leaderboard 500, users 1000, fills 5000, series 2000'],
      CURSOR,
      ['--builder <a>', 'Builder address (required by profile, users, fills, series)'],
      ['--breakdown-limit <n>', 'Rows per breakdown, max 1000 (profile only)'],
      ['--symbol <s>', 'One symbol (fills only)'],
      ['--side <s>', 'buy | sell (fills only)'],
      START, END,
      ['--bucket <b>', '1h | 1d (series only)'],
    ],
    ints: ['limit', 'breakdownLimit'],
  });
}
