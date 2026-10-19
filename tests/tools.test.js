// The thin commands over the 2026-10-19 MCP tools (Hyperliquid, Polymarket L2 feed, perp open
// interest and long/short): each must call its own tool and forward only the flags it was
// given, under the tool's snake_case parameter names. fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerHl } from '../src/commands/hl.js';
import { registerPerp } from '../src/commands/perp.js';
import { registerPolymarket } from '../src/commands/polymarket.js';
import { registerWallet } from '../src/commands/wallet.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

async function run(argv) {
  vi.stubEnv('VIKE_API_KEY', 'vk_test');
  vi.stubEnv('VIKE_MCP_URL', 'https://mcp.invalid/mcp');
  const fetchMock = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({
      jsonrpc: '2.0', id: 1,
      result: { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const program = new Command();
  registerHl(program);
  registerPerp(program);
  registerPolymarket(program);
  registerWallet(program);
  await program.parseAsync(['node', 'vike-data', ...argv, '--json']);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  return { tool: body.params.name, args: body.params.arguments };
}

const CASES = [
  ['hl cohort-metrics BTC --axis pnl --hours 24 --label-basis point_in_time',
    'hl_cohort_metrics', { symbol: 'BTC', axis: 'pnl', hours: 24, label_basis: 'point_in_time' }],
  ['hl segments --view summary --cohort smart --axis pnl --opened-within 24h',
    'hl_segments', { view: 'summary', cohort: 'smart', axis: 'pnl', opened_within: '24h' }],
  ['hl wallet 0xabc --view trades_summary --window 30d',
    'hl_wallet', { address: '0xabc', view: 'trades_summary', window: '30d' }],
  ['hl activity 0xabc --view funding --symbol ETH --limit 20',
    'hl_wallet_activity', { address: '0xabc', view: 'funding', symbol: 'ETH', limit: 20 }],
  ['hl leaderboard --view flow_adjusted --window 7d --min-trades 20 --min-win-rate 0.6 --limit 5',
    'hl_leaderboard', { view: 'flow_adjusted', window: '7d', min_trades: 20, min_win_rate: 0.6, limit: 5 }],
  ['hl liquidations --view heatmap --symbol ETH --bins 20',
    'hl_liquidations', { view: 'heatmap', symbol: 'ETH', bins: 20 }],
  ['hl market --view positions --symbol BTC --axis size --cohort "4x whale" --limit 50',
    'hl_market', { view: 'positions', symbol: 'BTC', axis: 'size', cohort: '4x whale', limit: 50 }],
  ['hl builders --view series --builder 0xbbb --bucket 1d --limit 30',
    'hl_builders', { view: 'series', builder: '0xbbb', bucket: '1d', limit: 30 }],
  ['perp open-interest BTC --exchange binance --hours 48',
    'perp_open_interest', { symbol: 'BTC', exchange: 'binance', hours: 48 }],
  ['perp long-short ETH',
    'perp_long_short', { symbol: 'ETH' }],
  ['polymarket tape 123 --from-ms 1000 --to-ms 2000 --event-type trade --limit 50',
    'polymarket_tape', { token_id: '123', from_ms: 1000, to_ms: 2000, event_type: 'trade', limit: 50 }],
  ['polymarket orderbook 123 --depth 5',
    'polymarket_orderbook', { token_id: '123', depth: 5 }],
  ['polymarket stats 123',
    'polymarket_market_stats', { token_id: '123' }],
  ['polymarket settlement 0xdead',
    'polymarket_settlement', { condition_id: '0xdead' }],
  // base and hyperevm serve window=all only: an unset --window must not become 30d
  ['wallet discover --chain base --size 3',
    'wallet_discover', { sort: 'volume', order: 'desc', chain: 'base', size: 3 }],
  ['wallet discover --chain ethereum --window 7d',
    'wallet_discover', { window: '7d', sort: 'volume', order: 'desc', chain: 'ethereum', size: 10 }],
  ['pm archive --view datasets --asset btc --tenor 5m --stream trades --date-from 2026-10-15 --limit 3',
    'polymarket_archive', { view: 'datasets', asset: 'btc', tenor: '5m', stream: 'trades', date_from: '2026-10-15', limit: 3 }],
];

describe('thin tool commands', () => {
  it.each(CASES)('%s', async (line, tool, args) => {
    const sent = await run(line.match(/"[^"]*"|\S+/g).map((t) => t.replace(/^"|"$/g, '')));
    expect(sent.tool).toBe(tool);
    expect(sent.args).toEqual(args); // exactly these: an unset flag is not sent
  });

  it('refuses a tape call without its window before any request', async () => {
    vi.stubEnv('VIKE_API_KEY', 'vk_test');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const program = new Command().exitOverride();
    registerPolymarket(program);
    await expect(program.parseAsync(['node', 'vike-data', 'polymarket', 'tape', '123']))
      .rejects.toThrow(/required option/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
