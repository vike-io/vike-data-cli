import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';
import { addTool } from './tool-command.js';

export function registerPerp(program) {
  const cmd = program
    .command('perp')
    .description('Perpetual-futures funding, spreads, and Hyperliquid trader leaderboard');

  cmd
    .command('funding')
    .description('Funding rates per venue (raw per-interval rate + interval_h), or the top 5 cross-venue funding-arb rows')
    .option('--symbol <s>', 'Specific symbol (e.g. BTC). Omit for top arb opportunities.')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('perp_funding', { symbol: opts.symbol });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('spreads')
    .description('Cross-venue perp price gaps: the 10 widest (buy on one venue, sell on another)')
    .option('--symbol <s>', 'Filter those 10 to one symbol (often empty). Omit for all.')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('perp_spreads', { symbol: opts.symbol });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  const venue = [
    ['--exchange <e>', 'One venue, lower case (e.g. binance). Omit for all.'],
    ['--hours <n>', 'Omit for the latest print per venue; 1-168 for an hourly series'],
  ];

  addTool(cmd, 'open-interest', {
    tool: 'perp_open_interest',
    arg: 'symbol',
    desc: 'Open interest of one symbol per venue (oi_usd is USD notional): latest print or hourly series',
    options: venue,
    ints: ['hours'],
  });

  addTool(cmd, 'long-short', {
    tool: 'perp_long_short',
    arg: 'symbol',
    desc: 'Long/short share of one symbol per venue (each venue counts something different: read `basis`)',
    options: venue,
    ints: ['hours'],
  });

  cmd
    .command('find-position')
    .description('Reverse-lookup HL open positions matching a share-card (coin/side/lev/entry)')
    .requiredOption('--coin <s>', 'Asset symbol (e.g. BTC, ETH)')
    .requiredOption('--side <s>', 'long | short')
    .requiredOption('--leverage <x>', 'Leverage from the share card (e.g. 25)')
    .requiredOption('--entry <p>', 'Entry price from the share card')
    .option('--mark <p>', 'Optional current mark price (sharpens tie-break)')
    .option('--limit <n>', 'Max matches (default 10, max 50)', '10')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        // The tool renamed `coin` to `symbol` on 2026-10-19; `--coin` stays the flag users know.
        const r = await callTool('hl_position_match', {
          symbol: opts.coin,
          side: opts.side,
          leverage: Number(opts.leverage),
          entry_price: Number(opts.entry),
          mark_price: opts.mark != null ? Number(opts.mark) : undefined,
          limit: parseInt10(opts.limit, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('top-traders')
    .description('Top Hyperliquid perp wallets by PnL / ROI / win rate / volume')
    .option('--window <w>', '1d | 7d | 30d | all', '30d')
    .option('--sort <s>', 'pnl | roi | win_rate | volume | trade_count | drawdown', 'pnl')
    .option('--order <o>', 'asc | desc', 'desc')
    .option('--min-trades <n>', 'Minimum trade count', '3')
    .option('--min-win-rate <p>', 'Minimum win rate percent (0-100)', '0')
    .option('--min-volume <usd>', 'Minimum volume USD', '0')
    .option('--size <n>', 'Page size (max 20)', '10')
    .option('--json', 'Emit JSON')
    .action(async (opts) => {
      try {
        const r = await callTool('hl_perp_top_traders', {
          window: opts.window,
          sort: opts.sort,
          order: opts.order,
          min_trades: parseInt10(opts.minTrades, 3),
          min_win_rate: opts.minWinRate,
          min_volume: opts.minVolume,
          size: parseInt10(opts.size, 10),
        });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });
}
