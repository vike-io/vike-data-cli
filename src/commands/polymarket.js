import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';
import { addTool } from './tool-command.js';

export function registerPolymarket(program) {
  const cmd = program
    .command('polymarket')
    .alias('pm')
    .description('Polymarket prediction-market analytics (markets, traders, smart money)');

  cmd
    .command('markets')
    .description('Trending Polymarket markets ranked by 24h volume')
    .option('--category <c>', 'Crypto | Sports | Politics | Pop-Culture | Tech | all', 'all')
    .option('--limit <n>', 'Max markets (max 30)', '10')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('polymarket_markets', {
          category: opts.category,
          limit: parseInt10(opts.limit, 10),
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

  // The recorded L2 feed. These five take an OUTCOME TOKEN id (a long decimal number from
  // `market` -> clob_token_ids), except settlement, which takes the condition_id.
  addTool(cmd, 'tape', {
    tool: 'polymarket_tape',
    arg: 'token_id',
    desc: 'Raw event tape of one outcome token for a window of at most 24h, oldest first (max 1000 events a page)',
    options: [
      ['--from-ms <ms>', 'Epoch milliseconds, inclusive', true],
      ['--to-ms <ms>', 'Epoch milliseconds, EXCLUSIVE, at most 24h after --from-ms', true],
      ['--event-type <t>', 'trade | book | price_change | tick_size_change | status (pass it: untyped pages are mostly price_change)'],
      ['--cursor <c>', 'next_cursor from the previous page, same window'],
      ['--limit <n>', 'Max events (default 100, max 1000)'],
    ],
    ints: ['fromMs', 'toMs', 'limit'],
  });

  addTool(cmd, 'orderbook', {
    tool: 'polymarket_orderbook',
    arg: 'token_id',
    desc: 'Order book of one outcome token at an instant (nearest snapshot at or before --ts), flattened to price levels',
    options: [
      ['--ts <ms>', 'Epoch milliseconds. Omit for the latest snapshot.'],
      ['--depth <n>', 'Levels per side, 1-25 (default 25)'],
    ],
    ints: ['ts', 'depth'],
  });

  addTool(cmd, 'stats', {
    tool: 'polymarket_market_stats',
    arg: 'token_id',
    desc: 'What is recorded for one outcome token: events, trades, volume in shares, snapshots, first and last write',
  });

  addTool(cmd, 'settlement', {
    tool: 'polymarket_settlement',
    arg: 'condition_id',
    desc: 'On-chain resolution of one market: winning outcome, payouts, block and time ([] = not resolved on chain)',
  });

  addTool(cmd, 'archive', {
    tool: 'polymarket_archive',
    desc: 'Index of the bulk L2 Parquet archive, or the download URL of one file (never downloads)',
    options: [
      ['--view <v>', 'datasets | url (default datasets)'],
      ['--asset <a>', 'Family files only, e.g. btc (with --tenor)'],
      ['--tenor <t>', 'Family files only, e.g. 5m (with --asset)'],
      ['--stream <s>', 'book_events | trades | l1_quotes'],
      ['--date <d>', 'YYYY-MM-DD (view url, required there)'],
      ['--date-from <d>', 'YYYY-MM-DD (datasets only)'],
      ['--date-to <d>', 'YYYY-MM-DD (datasets only)'],
      ['--limit <n>', 'Files per page (datasets only, default 50, max 200)'],
      ['--offset <n>', 'Files to skip (datasets only)'],
    ],
    ints: ['limit', 'offset'],
  });
}
