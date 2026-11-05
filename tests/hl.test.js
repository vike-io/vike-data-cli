// `hl market --view funding_rates` must be offered and must send the flags that view takes on
// MCP (symbol sort order start end limit cursor). fetch is mocked; nothing leaves the machine.

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
