// `perp find-position` must send `symbol` to hl_position_match: the tool renamed
// `coin` to `symbol` on 2026-10-19. fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerPerp } from '../src/commands/perp.js';

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
      result: { content: [{ type: 'text', text: JSON.stringify({ match_count: 0, matches: [] }) }] },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const program = new Command();
  registerPerp(program);
  await program.parseAsync(['node', 'vike-data', 'perp', ...args]);
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('perp find-position', () => {
  it('sends symbol, not coin, to hl_position_match', async () => {
    const body = await run([
      'find-position', '--coin', 'ETH', '--side', 'long',
      '--leverage', '25', '--entry', '3210', '--json',
    ]);
    expect(body.params.name).toBe('hl_position_match');
    expect(body.params.arguments).toMatchObject({
      symbol: 'ETH', side: 'long', leverage: 25, entry_price: 3210,
    });
    expect(body.params.arguments).not.toHaveProperty('coin');
  });
});
