// `polymarket chainlink-prices <symbol>` must call polymarket_chainlink_prices with the symbol and
// the given flags under their snake_case names, and send no flag that was not given (the server's
// defaults stay the defaults). fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerPolymarket } from '../src/commands/polymarket.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

async function run(args) {
  vi.stubEnv('VIKE_API_KEY', 'vk_test');
  vi.stubEnv('VIKE_MCP_URL', 'https://mcp.invalid/mcp');
  const fetchMock = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({
      jsonrpc: '2.0', id: 1,
      result: { content: [{ type: 'text', text: JSON.stringify({ rows: [], has_more: false, next_cursor: null }) }] },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const program = new Command();
  registerPolymarket(program);
  await program.parseAsync(['node', 'vike-data', 'polymarket', ...args]);
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('polymarket chainlink-prices', () => {
  it('sends the symbol and every given flag to polymarket_chainlink_prices', async () => {
    const body = await run([
      'chainlink-prices', 'btc', '--series', 'twap60', '--interval', '15m',
      '--from-ms', '1794268800000', '--to-ms', '1794355200000', '--cursor', 'c1', '--limit', '96', '--json',
    ]);
    expect(body.params.name).toBe('polymarket_chainlink_prices');
    expect(body.params.arguments).toEqual({
      symbol: 'btc', series: 'twap60', interval: '15m',
      from_ms: '1794268800000', to_ms: '1794355200000', cursor: 'c1', limit: '96',
    });
  });

  it('sends only the symbol when no flag is given', async () => {
    const body = await run(['chainlink-prices', 'eth', '--json']);
    expect(body.params.arguments).toEqual({ symbol: 'eth' });
  });
});
