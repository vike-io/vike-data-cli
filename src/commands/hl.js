import { addTool } from './tool-command.js';

// One subcommand per Hyperliquid MCP tool; each takes `--view` (the first view is the default).
// `hl_perp_top_traders` and `hl_position_match` stay under `perp`, candles under `candles`.
// Flags carry the tool's own parameter names (--opened-within -> opened_within).
const view = (views) => ['--view <v>', `${views.join(' | ')} (default ${views[0]})`];
const SYMBOL = ['--symbol <s>', 'Instrument, e.g. BTC; a HIP-3 market is dex:TICKER (xyz:TSLA)'];
const START = ['--start <t>', 'ISO-8601 UTC lower bound, e.g. 2026-10-01T00:00:00Z'];
const END = ['--end <t>', 'ISO-8601 UTC upper bound'];
const CURSOR = ['--cursor <c>', 'nextCursor from the previous page, verbatim'];
const LIMIT = ['--limit <n>', 'Rows per page'];
const OPENED = ['--opened-within <w>', 'Only positions opened within: 24h | 7d | 30d | all'];
const AXIS = ['--axis <a>', 'Cohort ladder: size | pnl | pnl_abs'];
const COHORT = ['--cohort <c>', 'One cohort label on --axis, e.g. whale or "3x smart" (`hl segments --view cohorts` lists them)'];
const WINDOW = ['--window <w>', '1d | 7d | 30d | all'];
const VAULT_WINDOW = ['--window <w>', '7d | 30d | 90d | 365d | all'];
const ORDER = ['--order <o>', 'desc | asc'];
const SIDE = ['--side <s>', 'buy | sell'];
const WALLET = ['--wallet <a>', 'One wallet (0x + 40 hex)'];

export function registerHl(program) {
  const hl = program
    .command('hl')
    .description('Hyperliquid: cohort positioning, wallets, leaderboards, liquidations, markets, builders, vaults');

  addTool(hl, 'cohort-metrics <symbol>', {
    tool: 'hl_cohort_metrics',
    args: ['symbol'],
    desc: 'Hourly long/short positioning of one perp split by cohort (are whales / smart money long or short)',
    options: [
      ['--axis <a>', 'size | pnl | pnl_abs | tier | trade_size | pnl_unrealized (default size)'],
      ['--hours <n>', 'Hourly buckets, newest first, max 8760 (default 168; 1-24 for a current read)'],
      START, END, OPENED,
      ['--label-basis <b>', 'current | point_in_time (point_in_time for any backtest)'],
      ['--grading <g>', 'realized | realized-pit | unrealized (pnl axes only)'],
      ['--include <list>', 'Comma list: volume, median_pnl (newest hour only)'],
      CURSOR,
    ],
  });

  addTool(hl, 'segments', {
    tool: 'hl_segments',
    desc: 'Cohort vocabulary, one cohort now, the symbol x cohort board, or one cohort hour by hour',
    options: [
      view(['segments', 'cohorts', 'summary', 'heatmap', 'history']),
      ['--cohort <c>', 'One label (required by summary and history)'],
      ['--axis <a>', 'size | pnl | pnl_abs (history: size or pnl, required)'],
      OPENED, START, END,
      ['--hours <n>', 'history: window length in hours (default 168)'],
      ['--limit <n>', 'history: max hourly rows (default 5000)'],
      ['--include <list>', 'history: leverage'],
    ],
  });

  addTool(hl, 'wallet <address>', {
    tool: 'hl_wallet',
    args: ['address'],
    desc: 'One wallet: equity, open positions, cohort labels, risk metrics and lifetime flow (or closed-trade stats)',
    options: [view(['summary', 'trades_summary']), WINDOW, OPENED],
  });

  addTool(hl, 'wallet-activity <address>', {
    tool: 'hl_wallet_activity',
    args: ['address'],
    desc: 'One wallet\'s fills, funding, ledger (deposits, withdrawals, transfers, vault events) or builder routing',
    options: [
      view(['fills', 'funding', 'ledger', 'builders']),
      SYMBOL, START, END, SIDE,
      ['--event-type <t>', 'ledger: one event type, e.g. deposit, withdraw, vaultDeposit'],
      ['--window <w>', 'builders: 1d | 7d | 30d | all'],
      ['--limit <n>', 'Rows per page (default 100, max 5000; builders 50, max 500)'],
      CURSOR,
    ],
  });

  addTool(hl, 'leaderboard', {
    tool: 'hl_leaderboard',
    desc: 'Traders ranked on any of 20 metrics with the full risk set, or on fills-derived trading PnL',
    options: [
      view(['ranking', 'flow_adjusted']),
      ['--window <w>', '1d | 7d | 30d | all (default 30d)'],
      ['--sort <s>', 'pnl | realized_pnl | roi | volume | trades | win_rate | profit_factor | calmar | max_drawdown | ... (default pnl)'],
      ORDER, COHORT, AXIS,
      ['--min-trades <n>', 'Minimum closed trades (default 3; 0 = no floor)'],
      ['--min-win-rate <f>', 'FRACTION 0-1 (0.6 = 60%), unlike `perp top-traders`'],
      ['--min-volume <usd>', 'Minimum total volume in USD'],
      ['--limit <n>', 'Rows per page (default 25, max 500)'],
      CURSOR,
    ],
  });

  addTool(hl, 'liquidations', {
    tool: 'hl_liquidations',
    desc: 'Liquidation events, the share of open notional near liquidation per symbol, or one symbol\'s liquidation heatmap',
    options: [
      view(['fills', 'risk', 'heatmap']),
      ['--symbol <s>', 'One symbol (required by heatmap)'],
      ['--wallet <a>', 'fills: has this wallet been liquidated'],
      START, END,
      ['--direction <d>', 'fills: long | short, the side that was closed'],
      AXIS, COHORT,
      ['--min-value-usd <usd>', 'risk: smallest open notional a symbol needs to be ranked'],
      ['--bins <n>', 'heatmap: price bins, 5-500 (default 50)'],
      ['--limit <n>', 'Rows per page (fills max 5000, risk max 500)'],
      CURSOR,
    ],
  });

  addTool(hl, 'market', {
    tool: 'hl_market',
    desc: 'Open interest per symbol, one symbol\'s hourly series, size breakdown, positions, indices or large fills',
    options: [
      view(['open_interest', 'symbol_metrics', 'size_breakdown', 'positions', 'indices', 'large_fills']),
      ['--symbol <s>', 'One symbol (required by every view but open_interest and positions)'],
      WALLET, AXIS, COHORT, OPENED, START, END,
      ['--open-only <bool>', 'positions: true (default) = latest open; false needs --start'],
      ['--sort <s>', 'positions: size = biggest positions of one --symbol first'],
      ['--resolution <r>', 'positions history: 5m | 1h'],
      ['--label-basis <b>', 'symbol_metrics: current'],
      ['--hours <n>', 'indices: window in hours; large_fills: look-back, max 24'],
      ['--min-usd <usd>', 'large_fills: smallest fill, at least 50000'],
      LIMIT, CURSOR,
    ],
  });

  addTool(hl, 'builders', {
    tool: 'hl_builders',
    desc: 'Builder codes: leaderboard, venue-wide stats, one builder\'s profile, users, fills or series',
    options: [
      view(['leaderboard', 'stats', 'profile', 'users', 'fills', 'series']),
      ['--builder <a>', 'Builder address (required by profile, users, fills, series)'],
      ['--window <w>', '1d | 7d | 30d | all (default 30d)'],
      ['--sort <s>', 'leaderboard: fee | volume | users | fills; users: volume | fees | pnl'],
      ORDER, SYMBOL, SIDE, START, END,
      ['--bucket <b>', 'series: 1h | 1d'],
      ['--breakdown-limit <n>', 'profile: rows per breakdown, max 1000'],
      LIMIT, CURSOR,
    ],
  });

  addTool(hl, 'vaults', {
    tool: 'hl_vaults',
    desc: 'Every vault with TVL, APR, PnL and flows, platform vault stats, or deposits and withdrawals across vaults',
    options: [
      view(['list', 'stats', 'flows']),
      VAULT_WINDOW,
      ['--sort <s>', 'list: tvl | apr | pnl | return | net_flow | volume | age | leverage | top5_share'],
      ORDER,
      ['--status <s>', 'list: open | closed | all'],
      ['--deposits <d>', 'list: any | open | closed'],
      ['--min-tvl <usd>', 'list: minimum TVL in USD'],
      ['--q <text>', 'list: part of a vault name, or an address prefix'],
      ['--min-usd <usd>', 'flows: smallest flow in USD (default 10000)'],
      ['--type <t>', 'flows: all | deposit | withdraw | distribution | commission'],
      ['--smart-only <bool>', 'flows: only top-1000 all-time PnL depositors'],
      LIMIT, CURSOR,
    ],
  });

  addTool(hl, 'vault <vault>', {
    tool: 'hl_vault',
    args: ['vault'],
    desc: 'One vault: profile, depositors, its own flows, or an equity / PnL series',
    options: [
      view(['profile', 'depositors', 'flows', 'series']),
      ['--sort <s>', 'depositors: share | pnl | all_time_pnl | entered'],
      ORDER,
      ['--smart-only <bool>', 'depositors: only top-1000 all-time PnL wallets'],
      ['--min-equity-usd <usd>', 'depositors: smallest equity, at least 1'],
      VAULT_WINDOW,
      ['--type <t>', 'flows: all | deposit | withdraw | distribution | commission'],
      ['--bucket <b>', 'series: 1h | 1d'],
      START, END, LIMIT, CURSOR,
    ],
  });
}
