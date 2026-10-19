// `wallet summary` sends `chain` only when --chain is given (the server answers ethereum/bsc first
// otherwise). fetch is mocked; nothing leaves the machine.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerWallet } from '../src/commands/wallet.js';

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
      result: { content: [{ type: 'text', text: JSON.stringify({ chain: 'ethereum' }) }] },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const program = new Command();
  registerWallet(program);
  await program.parseAsync(['node', 'vike-data', 'wallet', ...args]);
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('wallet summary', () => {
  const ADDR = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

  it('sends no chain by default', async () => {
    const body = await run(['summary', ADDR, '--json']);
    expect(body.params.name).toBe('wallet_summary');
    expect(body.params.arguments).toEqual({ address: ADDR });
  });

  it('sends chain when --chain is given', async () => {
    const body = await run(['summary', ADDR, '--chain', 'base', '--json']);
    expect(body.params.arguments).toEqual({ address: ADDR, chain: 'base' });
  });
});
