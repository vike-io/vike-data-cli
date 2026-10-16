import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';

export function registerCandles(program) {
  const cmd = program
    .command('candles')
    .description('Historical OHLCV candles — Hyperliquid markets and Polymarket outcome tokens');

  cmd
    .command('hl <symbol>')
    .description('Hyperliquid candles (perp or spot), aggregated from HL executed fills')
    .option('--interval <i>', '1m | 5m | 15m | 30m | 1h | 4h | 1d', '1h')
    .option('--market <m>', 'perp | spot', 'perp')
    .option('--dex <d>', 'Perp DEX (default HL, the core venue; others are HIP-3 builder DEXs)')
    .option('--start <t>', 'ISO-8601 UTC or epoch ms (inclusive)')
    .option('--end <t>', 'ISO-8601 UTC or epoch ms (exclusive)')
    .option('--limit <n>', 'Max candles (default 500, max 5000)', '500')
    .option('--json', 'Emit JSON')
    .action(async (symbol, opts) => {
      try {
        const args = {
          symbol,
          interval: opts.interval,
          market: opts.market,
          limit: parseInt10(opts.limit, 500),
        };
        if (opts.dex !== undefined) args.dex = opts.dex;
        if (opts.start !== undefined) args.start = opts.start;
        if (opts.end !== undefined) args.end = opts.end;
        const r = await callTool('hl_ohlcv', args);
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('polymarket <token_id>')
    .description('Candles for ONE Polymarket outcome token (prices are probabilities, 0-1)')
    .option('--interval <i>', '1m | 5m | 1h | 1d', '1h')
    .option('--from <ms>', 'Epoch milliseconds, inclusive lower bound')
    .option('--to <ms>', 'Epoch milliseconds, inclusive upper bound')
    .option('--limit <n>', 'Max candles (default 500, max 1000)', '500')
    .option('--json', 'Emit JSON')
    .action(async (tokenId, opts) => {
      try {
        const args = {
          token_id: tokenId,
          interval: opts.interval,
          limit: parseInt10(opts.limit, 500),
        };
        if (opts.from !== undefined) args.from = opts.from;
        if (opts.to !== undefined) args.to = opts.to;
        const r = await callTool('polymarket_ohlcv', args);
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });
}
