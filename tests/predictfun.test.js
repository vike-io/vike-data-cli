// Each `predictfun` subcommand must call its predictfun_* MCP tool with the positional argument and
// the given flags under the tool's parameter names (--query -> q), and send no flag that was not
// given (the server's defaults stay the defaults). fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerPredictfun } from '../src/commands/predictfun.js';

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
      result: { content: [{ type: 'text', text: JSON.stringify({ trades: [], next_cursor: null }) }] },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const program = new Command();
  registerPredictfun(program);
  await program.parseAsync(['node', 'vike-data', 'predictfun', ...args, '--json']);
  return JSON.parse(fetchMock.mock.calls[0][1].body).params;
}

const W = '0x1111111111111111111111111111111111111111';

describe('predictfun', () => {
  it.each([
    [['overview'], 'predictfun_overview', {}],
    [['markets', '--status', 'open', '--query', 'bnb', '--sort', 'newest', '--limit', '100', '--cursor', 'n:1:2'],
      'predictfun_markets', { status: 'open', q: 'bnb', sort: 'newest', limit: '100', cursor: 'n:1:2' }],
    [['markets'], 'predictfun_markets', {}],
    [['market', '123'], 'predictfun_market_detail', { market_id: '123' }],
    [['orderbook', '123'], 'predictfun_market_book', { market_id: '123' }],
    [['market-trades', '123', '--limit', '500', '--cursor', '1:2:3'],
      'predictfun_market_trades', { market_id: '123', limit: '500', cursor: '1:2:3' }],
    [['wallet', W], 'predictfun_wallet_positions', { address: W }],
    [['wallet-trades', W, '--limit', '10'], 'predictfun_wallet_trades', { address: W, limit: '10' }],
    [['leaderboard', '--window', '7d', '--sort', 'volume', '--limit', '50', '--offset', '50'],
      'predictfun_leaderboard', { window: '7d', sort: 'volume', limit: '50', offset: '50' }],
  ])('%j calls %s', async (args, tool, expected) => {
    const params = await run(args);
    expect(params.name).toBe(tool);
    expect(params.arguments).toEqual(expected);
  });
});
