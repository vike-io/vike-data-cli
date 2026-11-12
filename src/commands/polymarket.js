import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';
import { addTool } from './tool-command.js';

export function registerPolymarket(program) {
  const cmd = program
    .command('polymarket')
    .alias('pm')
    .description('Polymarket prediction-market analytics (markets, traders, smart money, tape, order book, settlements, Chainlink prices, archive)');

  cmd
    .command('markets')
    .description('Trending Polymarket markets ranked by 24h volume (or --view search / market)')
    .option('--view <v>', 'trending (default) | search (by slug) | market (one by --condition-id)')
    .option('--category <c>', 'trending: Crypto | Sports | Politics | Pop-Culture | Tech | all (default all)')
    .option('--query <q>', 'search: part of the market slug')
    .option('--active <bool>', 'search: true = only active, false = only closed')
    .option('--offset <n>', 'search: rows to skip')
    .option('--condition-id <id>', 'market: the condition id')
    .option('--limit <n>', 'Max markets (trending default 10, max 30; search default 50, max 100)')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('polymarket_markets', {
          view: opts.view,
          category: opts.category,
          query: opts.query,
          active: opts.active,
          offset: opts.offset,
          condition_id: opts.conditionId,
          limit: opts.limit,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('market <condition_id>')
    .description('Deep-dive on one Polymarket market by condition_id')
    .option('--json', 'Emit JSON')
    .action(async (conditionId, opts) => {
      try {
        const r = await callTool('polymarket_market_detail', {
          condition_id: conditionId,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('wallet <address>')
    .description('Profile a Polymarket trader (PnL / hit-rate / categories)')
    .option('--window <w>', '24h | 7d | 30d | all', 'all')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('polymarket_wallet', {
          address,
          window: opts.window,
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('smart-money')
    .description('Smart-money flows or mispricings on Polymarket')
    .option('--mode <m>', 'flows | mispricings', 'flows')
    .option('--hours <n>', 'Lookback hours', '24')
    .option('--category <c>', 'Crypto | Sports | Politics | Pop-Culture | Tech | all', 'all')
    .option('--limit <n>', 'Max rows (max 20)', '10')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('polymarket_smart_money', {
          mode: opts.mode,
          hours: parseInt10(opts.hours, 24),
          category: opts.category,
          limit: parseInt10(opts.limit, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  const FROM = ['--from-ms <ms>', 'Epoch milliseconds, inclusive'];
  const TO = ['--to-ms <ms>', 'Epoch milliseconds, EXCLUSIVE'];
  const CURSOR = ['--cursor <c>', 'next_cursor from the previous page'];

  addTool(cmd, 'market-trades <condition_id>', {
    tool: 'polymarket_market_trades',
    args: ['condition_id'],
    desc: 'One market\'s trades with the wallet behind each, newest first (one row = one order\'s fill)',
    options: [FROM, TO, CURSOR, ['--limit <n>', 'Rows per page (default 100)']],
  });

  addTool(cmd, 'tape', {
    tool: 'polymarket_tape',
    desc: 'Raw L2 event tape of outcome tokens over one window of at most 24 hours, oldest first',
    options: [
      ['--token-id <id>', 'One outcome token id (decimal), not a condition_id'],
      ['--token-ids <list>', 'Comma-separated outcome token ids, at most 100'],
      ['--from-ms <ms>', 'Required. Window start, epoch ms, inclusive'],
      ['--to-ms <ms>', 'Required. Window end, epoch ms, exclusive, at most 24h after --from-ms'],
      ['--event-type <t>', 'book | price_change | trade | tick_size_change | status (strongly recommended)'],
      CURSOR,
      ['--limit <n>', 'Events per page (default 100)'],
    ],
  });

  addTool(cmd, 'orderbook <token_id>', {
    tool: 'polymarket_orderbook',
    args: ['token_id'],
    desc: 'Order-book snapshot of one outcome token at or before --ts (latest when omitted)',
    options: [
      ['--ts <ms>', 'As-of epoch milliseconds'],
      ['--depth <n>', 'Levels per side, 1-25 (default 25)'],
    ],
  });

  addTool(cmd, 'market-stats <token_id>', {
    tool: 'polymarket_market_stats',
    args: ['token_id'],
    desc: 'Tape summary of one outcome token: events, trades, volume in shares, first and last recorded time',
  });

  addTool(cmd, 'settlement <condition_id>', {
    tool: 'polymarket_settlement',
    args: ['condition_id'],
    desc: 'On-chain resolution of one market ([] = the chain has not resolved it)',
  });

  addTool(cmd, 'settlements', {
    tool: 'polymarket_settlements_bulk',
    desc: 'On-chain resolutions of many markets, oldest resolution first',
    options: [
      FROM, TO,
      ['--slug-prefix <p>', 'Only markets whose slug starts with this, e.g. btc-updown-5m-'],
      CURSOR,
      ['--limit <n>', 'Rows per page (default 100)'],
    ],
  });

  addTool(cmd, 'chainlink-prices <symbol>', {
    tool: 'polymarket_chainlink_prices',
    args: ['symbol'],
    desc: 'Chainlink Data Streams prices that Polymarket\'s crypto up/down markets resolve on, since 2026-11-06 09:24 UTC; '
      + '<symbol>: btc | eth | sol | xrp | doge | bnb | hype | zec',
    options: [
      ['--series <s>', 'price (default; what the markets resolve on) | twap60 (60-second TWAP)'],
      ['--interval <i>', '1s (default) | 1m | 5m | 15m | 1h | 4h | 1d; above 1s one row per bucket: the first tick at or after its start'],
      FROM, TO, CURSOR,
      ['--limit <n>', 'Rows per page (max 10000)'],
    ],
  });

  addTool(cmd, 'archive', {
    tool: 'polymarket_archive',
    desc: 'Index of the Parquet L2 archive, or a 7-day download link for one file (--view url)',
    options: [
      ['--view <v>', 'datasets | url (default datasets)'],
      ['--stream <s>', 'book_events | trades | l1_quotes (required for url)'],
      ['--date <d>', 'url: the UTC day, YYYY-MM-DD'],
      ['--date-from <d>', 'datasets: first UTC day, inclusive'],
      ['--date-to <d>', 'datasets: last UTC day, inclusive'],
      ['--asset <a>', 'Family files only, e.g. btc (with --tenor)'],
      ['--tenor <t>', 'Family files only, e.g. 5m (with --asset)'],
      ['--limit <n>', 'datasets: files per page (default 50)'],
      ['--offset <n>', 'datasets: skip this many files'],
    ],
  });

  addTool(cmd, 'leaderboard', {
    tool: 'polymarket_leaderboard',
    desc: 'Wallets ranked by realized P&L, hit rate, volume or trade count',
    options: [
      ['--category <c>', 'all | Crypto | Sports | Politics | Pop-Culture | Tech (default all)'],
      ['--window <w>', '24h | 7d | 30d | all (default all)'],
      ['--sort <s>', 'realized_pnl | realized_pnl_window | hit_rate | resolved | volume_all | trades_all | last_seen | markets | ...'],
      ['--min-resolved <n>', 'Minimum resolved markets (default 20)'],
      ['--min-volume-usd <usd>', 'Minimum lifetime volume in USD'],
      ['--min-avg-usd <usd>', 'Minimum average trade in USD (20 drops bots)'],
      ['--limit <n>', 'Rows per page (default 20, max 50)'],
      ['--offset <n>', 'Rows to skip, 0-1000'],
    ],
  });
}
