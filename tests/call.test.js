// `vike-data call` and the exit code of a tool-level error. fetch is mocked; nothing leaves the machine.

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerCall } from '../src/commands/call.js';
import { registerPerp } from '../src/commands/perp.js';
import { registerHl } from '../src/commands/hl.js';
import { registerStream } from '../src/commands/stream.js';
import { registerSearch } from '../src/commands/search.js';
import { registerCandles } from '../src/commands/candles.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function mockTool(text, isError = false) {
  vi.stubEnv('VIKE_API_KEY', 'vk_test');
  vi.stubEnv('VIKE_MCP_URL', 'https://mcp.invalid/mcp');
  const fetchMock = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({
      jsonrpc: '2.0', id: 1,
      result: { content: [{ type: 'text', text }], isError },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  return { fetchMock, stdout };
}

async function run(register, args) {
  const program = new Command();
  register(program);
  await program.parseAsync(['node', 'vike-data', ...args]);
}

describe('vike-data call', () => {
  it('sends any tool with the --args object and prints the raw result', async () => {
    const raw = '{"trade_id": 12345678901234567890, "ok": true}';
    const { fetchMock, stdout } = mockTool(raw);
    await run(registerCall, ['call', 'hl_wallet', '--args', '{"address":"0xabc","view":"summary"}', '--timeout', '120']);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.method).toBe('tools/call');
    expect(body.params).toEqual({ name: 'hl_wallet', arguments: { address: '0xabc', view: 'summary' } });
    // printed as the server sent it: an integer above 2^53 is not rounded
    expect(stdout.mock.calls.map((c) => c[0]).join('')).toBe(raw + '\n');
    expect(process.exitCode).toBeUndefined();
  });

  it('sends the arguments text as given: a 77-digit token_id is not rounded', async () => {
    const id = '1'.repeat(77);
    const { fetchMock } = mockTool('{}');
    await run(registerCall, ['call', 'polymarket_orderbook', '--args', `{"token_id": ${id}, "depth": 5}`]);
    const body = fetchMock.mock.calls[0][1].body;
    expect(body).toContain(`"arguments":{"token_id": ${id}, "depth": 5}`);
    expect(JSON.parse(body).params.name).toBe('polymarket_orderbook');
  });

  it('reads --args-file and drops a UTF-8 BOM', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vike-call-'));
    const file = join(dir, 'args.json');
    writeFileSync(file, '﻿{"address":"0xabc"}\n');
    try {
      const { fetchMock } = mockTool('{}');
      await run(registerCall, ['call', 'wallet_ens', '--args-file', file]);
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).params.arguments).toEqual({ address: '0xabc' });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('sends {} when no --args is given', async () => {
    const { fetchMock } = mockTool('{}');
    await run(registerCall, ['call', 'alerts_list']);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).params.arguments).toEqual({});
  });

  it('refuses --args that is not a JSON object, without calling the server', async () => {
    const { fetchMock } = mockTool('{}');
    await run(registerCall, ['call', 'wallet_ens', '--args', '[1,2]', '--json']);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});

describe('a tool-level error exits 1 in every output mode', () => {
  it('call --json', async () => {
    const { stdout } = mockTool('{"error": "address must be 0x + 40 hex"}', true);
    await run(registerCall, ['call', 'wallet_ens', '--args', '{"address":"x"}', '--json']);
    expect(process.exitCode).toBe(1);
    expect(JSON.parse(stdout.mock.calls[0][0])).toEqual({ error: 'address must be 0x + 40 hex' });
  });

  it('a data command with --json', async () => {
    const { stdout } = mockTool('{"error": "unknown symbol"}', true);
    await run(registerPerp, ['perp', 'funding', '--symbol', 'NOPE', '--json']);
    expect(process.exitCode).toBe(1);
    expect(JSON.parse(stdout.mock.calls[0][0])).toEqual({ error: 'unknown symbol' });
  });

  it('a success still exits 0', async () => {
    mockTool('{"rows": []}');
    await run(registerPerp, ['perp', 'funding', '--json']);
    expect(process.exitCode).toBeUndefined();
  });
});

describe('one command per tool: flags become the tool parameters', () => {
  it.each([
    [registerHl, ['hl', 'orders', '--view', 'wallet', '--address', '0xabc', '--from', '2026-10-01T00:00:00Z', '--status', 'filled'],
      'hl_orders', { view: 'wallet', address: '0xabc', from: '2026-10-01T00:00:00Z', status: 'filled' }],
    [registerHl, ['hl', 'orders', '--view', 'clusters', '--symbol', 'BTC', '--step-bps', '25', '--cohort-axis', 'size'],
      'hl_orders', { view: 'clusters', symbol: 'BTC', step_bps: '25', cohort_axis: 'size' }],
    [registerHl, ['hl', 'wallet-trades', '0xabc', '--limit', '5'], 'hl_wallet_trades', { address: '0xabc', limit: '5' }],
    [registerHl, ['hl', 'market', '--view', 'hourly', '--symbols', 'BTC,ETH', '--days', '7'],
      'hl_market', { view: 'hourly', symbols: 'BTC,ETH', days: '7' }],
    [registerSearch, ['search', 'vitalik.eth', '--limit', '3'], 'search', { q: 'vitalik.eth', limit: '3' }],
    [registerStream, ['stream', 'events', 'hl.fills', '--filter', 'coin=BTC', '--since-ms', '1793178870000'],
      'stream_events', { channel: 'hl.fills', filter: { coin: ['BTC'] }, since_ms: '1793178870000' }],
    [registerStream, ['stream', 'connections', '--hours', '24'], 'stream_connections', { hours: '24' }],
    // `latest` takes only market, dex and interval: no symbol, window or limit is sent with it
    [registerCandles, ['candles', 'hl', 'BTC', '--view', 'latest', '--market', 'spot', '--limit', '9'],
      'hl_ohlcv', { view: 'latest', market: 'spot' }],
    [registerCandles, ['candles', 'hl', 'BTC', '--interval', '5m'], 'hl_ohlcv', { symbol: 'BTC', interval: '5m' }],
    [registerPerp, ['perp', 'top-traders'], 'hl_perp_top_traders',
      { window: '30d', sort: 'pnl', order: 'desc', min_trades: 3, min_win_rate: '0', min_volume: '0', size: 20 }],
  ])('%#', async (register, args, tool, expected) => {
    const { fetchMock } = mockTool('{}');
    await run(register, [...args, '--json']);
    const { params } = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(params.name).toBe(tool);
    expect(params.arguments).toEqual(expected);
  });

  it('stream check exits 1 when the server refuses the filter', async () => {
    const { fetchMock } = mockTool('{"valid": false, "code": "bad_subscription", "message": "filter key \'x\' is not supported on hl.fills"}');
    await run(registerStream, ['stream', 'check', 'hl.fills', '--filter', 'x=1', '--path', 'hl', '--json']);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).params).toEqual({
      name: 'stream_check_filter', arguments: { channel: 'hl.fills', filter: { x: ['1'] }, path: 'hl' },
    });
    expect(process.exitCode).toBe(1);
  });
});
