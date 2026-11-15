// `hl market --view funding_rates` must be offered and must send the flags that view takes on
// MCP (symbol sort order start end limit cursor); so must `hl orders --view book`, the open view's
// cohort and market flags, and the walls, order_stats, squeeze and book_cohorts views' flags.
// fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerHl } from '../src/commands/hl.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function hlProgram() {
  const program = new Command();
  registerHl(program);
  return program;
}

async function run(args) {
  vi.stubEnv('VIKE_API_KEY', 'vk_test');
  vi.stubEnv('VIKE_MCP_URL', 'https://mcp.invalid/mcp');
  const fetchMock = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({
      jsonrpc: '2.0', id: 1,
      result: { content: [{ type: 'text', text: JSON.stringify({ data: [] }) }] },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  await hlProgram().parseAsync(['node', 'vike-data', 'hl', ...args]);
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('hl market --view funding_rates', () => {
  it('sends every flag of the view to hl_market', async () => {
    const body = await run([
      'market', '--view', 'funding_rates', '--symbol', 'xyz:CL', '--sort', 'rate', '--order', 'asc',
      '--start', '2026-11-01T00:00:00Z', '--end', '2026-11-02T00:00:00Z',
      '--limit', '24', '--cursor', 'c1', '--json',
    ]);
    expect(body.params.name).toBe('hl_market');
    expect(body.params.arguments).toEqual({
      view: 'funding_rates', symbol: 'xyz:CL', sort: 'rate', order: 'asc',
      start: '2026-11-01T00:00:00Z', end: '2026-11-02T00:00:00Z', limit: '24', cursor: 'c1',
    });
  });

  it('lists the view in the help', () => {
    const market = hlProgram().commands.find((c) => c.name() === 'hl')
      .commands.find((c) => c.name() === 'market');
    expect(market.helpInformation()).toContain('funding_rates');
  });
});

describe('hl orders', () => {
  it('--view book sends symbol, at, market, side and levels to hl_orders', async () => {
    const body = await run([
      'orders', '--view', 'book', '--symbol', 'HYPE/USDC', '--market', 'spot', '--at', '2026-11-13T09:00:00Z',
      '--side', 'bid', '--levels', '20', '--json',
    ]);
    expect(body.params.name).toBe('hl_orders');
    expect(body.params.arguments).toEqual({
      view: 'book', symbol: 'HYPE/USDC', market: 'spot', at: '2026-11-13T09:00:00Z', side: 'bid', levels: '20',
    });
  });

  it('--view open sends --cohort-axis and --cohort with --market', async () => {
    const body = await run([
      'orders', '--view', 'open', '--symbol', 'BTC', '--market', 'perp', '--cohort-axis', 'size', '--cohort', 'whale',
      '--limit', '50', '--json',
    ]);
    expect(body.params.arguments).toEqual({
      view: 'open', symbol: 'BTC', market: 'perp', cohort_axis: 'size', cohort: 'whale', limit: '50',
    });
  });

  it('lists the book view and its flags in the help', () => {
    const orders = hlProgram().commands.find((c) => c.name() === 'hl')
      .commands.find((c) => c.name() === 'orders');
    const help = orders.helpInformation();
    for (const s of ['book', '--market', '--side', '--levels', '--cohort-axis']) expect(help).toContain(s);
  });

  it('--view walls sends symbol, wallet, window, min_usd, kind, outcome, market, touch_bps, limit and cursor', async () => {
    const body = await run([
      'orders', '--view', 'walls', '--symbol', 'BTC', '--wallet', '0x1111111111111111111111111111111111111111',
      '--from', '2026-11-12T00:00:00Z', '--to', '2026-11-13T00:00:00Z', '--min-usd', '2000000', '--kind', 'resting',
      '--outcome', 'pulled', '--market', 'perp', '--touch-bps', '25', '--limit', '100', '--cursor', 'c1', '--json',
    ]);
    expect(body.params.name).toBe('hl_orders');
    expect(body.params.arguments).toEqual({
      view: 'walls', symbol: 'BTC', wallet: '0x1111111111111111111111111111111111111111',
      from: '2026-11-12T00:00:00Z', to: '2026-11-13T00:00:00Z', min_usd: '2000000', kind: 'resting',
      outcome: 'pulled', market: 'perp', touch_bps: '25', limit: '100', cursor: 'c1',
    });
  });

  it('--view order_stats sends address, window, min_usd and market', async () => {
    const body = await run([
      'orders', '--view', 'order_stats', '--address', '0x1111111111111111111111111111111111111111',
      '--from', '2026-11-06T00:00:00Z', '--to', '2026-11-13T00:00:00Z', '--min-usd', '100000', '--market', 'spot',
      '--json',
    ]);
    expect(body.params.arguments).toEqual({
      view: 'order_stats', address: '0x1111111111111111111111111111111111111111',
      from: '2026-11-06T00:00:00Z', to: '2026-11-13T00:00:00Z', min_usd: '100000', market: 'spot',
    });
  });

  it('--view squeeze sends symbol, at, step_bps, range_pct, cohort_axis and cohort', async () => {
    const body = await run([
      'orders', '--view', 'squeeze', '--symbol', 'ETH', '--at', '2026-11-13T09:00:00Z', '--step-bps', '50',
      '--range-pct', '10', '--cohort-axis', 'size', '--cohort', 'whale', '--json',
    ]);
    expect(body.params.arguments).toEqual({
      view: 'squeeze', symbol: 'ETH', at: '2026-11-13T09:00:00Z', step_bps: '50', range_pct: '10',
      cohort_axis: 'size', cohort: 'whale',
    });
  });

  it('--view book_cohorts sends symbol, window, cohort_axis, band_bps, interval and market', async () => {
    const body = await run([
      'orders', '--view', 'book_cohorts', '--symbol', 'BTC', '--from', '2026-11-12T00:00:00Z',
      '--to', '2026-11-13T00:00:00Z', '--cohort-axis', 'size', '--band-bps', '1000', '--interval', '5m',
      '--market', 'perp', '--json',
    ]);
    expect(body.params.arguments).toEqual({
      view: 'book_cohorts', symbol: 'BTC', from: '2026-11-12T00:00:00Z', to: '2026-11-13T00:00:00Z',
      cohort_axis: 'size', band_bps: '1000', interval: '5m', market: 'perp',
    });
  });

  it('lists the walls, order_stats, squeeze and book_cohorts views and their flags in the help', () => {
    const orders = hlProgram().commands.find((c) => c.name() === 'hl')
      .commands.find((c) => c.name() === 'orders');
    const help = orders.helpInformation();
    for (const s of ['walls', 'order_stats', 'squeeze', 'book_cohorts', '--min-usd', '--kind', '--outcome',
      '--touch-bps', '--band-bps', '--interval']) expect(help).toContain(s);
  });
});
