// `vike-data stream`: the frame handling against a mock socket. No connection leaves the machine.

import { EventEmitter } from 'node:events';
import { describe, it, expect, vi } from 'vitest';
import { parseFilters, runStream } from '../src/commands/stream.js';

class FakeSocket extends EventEmitter {
  constructor(url, opts, sockets) {
    super();
    this.url = url;
    this.opts = opts;
    this.sent = [];
    sockets.push(this);
  }

  send(text) { this.sent.push(JSON.parse(text)); }

  terminate() { this.emit('close', 1006, ''); }

  frame(obj) { this.emit('message', JSON.stringify(obj)); }

  pause() { this.paused = true; }

  resume() { this.paused = false; }
}

function start(subs, { full = false } = {}) {
  const sockets = [];
  const out = [];
  const log = [];
  const drains = [];
  const sleep = vi.fn(async () => {});
  const WebSocketImpl = class extends FakeSocket {
    constructor(url, opts) { super(url, opts, sockets); }
  };
  const done = runStream({
    url: 'wss://stream.invalid/v1/stream/hl',
    apiKey: 'vk_test',
    subs,
    out: (line) => { out.push(line); return !full; },
    drain: (cb) => drains.push(cb),
    log: (line) => log.push(line),
    WebSocketImpl,
    sleep,
  });
  return { sockets, out, log, drains, sleep, done };
}

const FILLS = { id: 'hl_fills', channel: 'hl.fills', filter: { coin: ['BTC'] } };
const LIQS = { id: 'hl_liquidations', channel: 'hl.liquidations' };

describe('parseFilters', () => {
  it('lists, repeats, numbers and one-value keys', () => {
    expect(parseFilters(['coin=BTC,ETH', 'min_usd=50000', 'side=buy', 'coin=SOL', 'pnl_cohort=3x smart']))
      .toEqual({ coin: ['BTC', 'ETH', 'SOL'], min_usd: 50000, side: 'buy', pnl_cohort: ['3x smart'] });
  });

  it('hl.candles lists, a yes/no key, a one-value role', () => {
    expect(parseFilters(['coin=BTC', 'interval=1m,5m', 'market=perp', 'dex=HL', 'contract=false', 'role=maker']))
      .toEqual({ coin: ['BTC'], interval: ['1m', '5m'], market: ['perp'], dex: ['HL'], contract: false, role: 'maker' });
  });

  it('hl.positions: min_leverage is a number, tag a list; pm.positions: action a list', () => {
    expect(parseFilters(['min_leverage=20', 'tag=scalper,high_risk', 'action=open,close']))
      .toEqual({ min_leverage: 20, tag: ['scalper', 'high_risk'], action: ['open', 'close'] });
  });

  it('refuses a pair with no key or a non-number', () => {
    expect(() => parseFilters(['BTC'])).toThrow(/key=value/);
    expect(() => parseFilters(['min_usd=lots'])).toThrow(/number/);
    expect(() => parseFilters(['min_leverage=high'])).toThrow(/number/);
  });
});

describe('runStream', () => {
  it('pongs, keeps a cursor per subscription, moves on gaps, resumes after a drop, and stops on 4410', async () => {
    const { sockets, out, log, done } = start([FILLS, LIQS]);
    const [ws] = sockets;
    expect(ws.opts.headers['X-API-KEY']).toBe('vk_test');
    expect(ws.opts.headers['User-Agent']).toMatch(/^vike-cli\/\d+\.\d+\.\d+/);

    ws.emit('open');
    expect(ws.sent).toEqual([
      { action: 'subscribe', id: 'hl_fills', channel: 'hl.fills', filter: { coin: ['BTC'] } },
      { action: 'subscribe', id: 'hl_liquidations', channel: 'hl.liquidations' },
    ]);

    ws.frame({ type: 'subscribed', id: 'hl_fills', channel: 'hl.fills', cursor: '1793178870000-0001', replay: { from: 'none' } });
    ws.frame({ type: 'subscribed', id: 'hl_liquidations', channel: 'hl.liquidations', cursor: '1793178870000-0001' });

    ws.frame({ type: 'ping' });
    expect(ws.sent.at(-1)).toEqual({ action: 'pong' });

    const event = '{"type":"event","ids":["hl_fills"],"channel":"hl.fills","cursor":"1793178871012-0004","event":{"trade_id":12345678901234567890}}';
    ws.emit('message', event);
    ws.frame({ type: 'gap', channel: 'hl.liquidations', cursor: '1793178900123-0001', from: 'a', to: 'b', reason: 'channel_idle' });
    expect(out[0]).toBe(event);                 // printed as received
    expect(JSON.parse(out[1]).type).toBe('gap');

    ws.emit('close', 1012, '');                 // a restart: reconnect with our own cursors
    await vi.waitFor(() => expect(sockets).toHaveLength(2));
    const ws2 = sockets[1];
    ws2.emit('open');
    expect(ws2.sent).toEqual([
      { action: 'subscribe', id: 'hl_fills', channel: 'hl.fills', filter: { coin: ['BTC'] }, cursor: '1793178871012-0004' },
      { action: 'subscribe', id: 'hl_liquidations', channel: 'hl.liquidations', cursor: '1793178900123-0001' },
    ]);

    ws2.frame({ type: 'error', code: 'replaced', message: 'a newer connection took over', cursors: {} });
    ws2.emit('close', 4410, 'replaced');
    await expect(done).resolves.toBe(1);
    expect(sockets).toHaveLength(2);            // no reconnect after 4410
    expect(log.join('\n')).toMatch(/replaced \(4410\)/);
  });

  it('cursor_expired: subscribes again from now', async () => {
    const { sockets, done } = start([{ ...FILLS, cursor: '1700000000000-0001' }]);
    const [ws] = sockets;
    ws.emit('open');
    expect(ws.sent[0].cursor).toBe('1700000000000-0001');
    ws.frame({ type: 'error', id: 'hl_fills', code: 'cursor_expired', message: 'cursor is older than 3 days' });
    expect(ws.sent.at(-1)).toEqual({ action: 'subscribe', id: 'hl_fills', channel: 'hl.fills', filter: { coin: ['BTC'] } });
    ws.frame({ type: 'error', id: 'hl_fills', code: 'bad_subscription', message: 'duplicate subscription id' });
    await expect(done).resolves.toBe(1);
  });

  it('a refused handshake: 401 stops, 503 tries again', async () => {
    const refuse = (ws, status, body) => {
      const res = new EventEmitter();
      res.statusCode = status;
      ws.emit('unexpected-response', {}, res);
      res.emit('data', body);
      res.emit('end');
    };

    const a = start([FILLS]);
    refuse(a.sockets[0], 503, '{"type":"error","code":"capacity","message":"at its connection limit","close_code":4503}');
    await vi.waitFor(() => expect(a.sockets).toHaveLength(2));
    refuse(a.sockets[1], 401, '{"type":"error","code":"unauthorized","message":"no valid credential","close_code":4401}');
    await expect(a.done).resolves.toBe(1);
    expect(a.sockets).toHaveLength(2);
    expect(a.log.join('\n')).toMatch(/HTTP 401 no valid credential/);
  });

  it('sends any channel name as given: the server decides what a path serves', async () => {
    const { sockets, done } = start([{ id: 'hl_candles', channel: 'hl.candles', filter: { coin: ['BTC'], interval: ['1m'] } }]);
    sockets[0].emit('open');
    expect(sockets[0].sent[0]).toEqual({ action: 'subscribe', id: 'hl_candles', channel: 'hl.candles', filter: { coin: ['BTC'], interval: ['1m'] } });
    sockets[0].frame({ type: 'error', id: 'hl_candles', code: 'unknown_channel', message: "unknown channel 'hl.candles'; available: [...]" });
    await expect(done).resolves.toBe(1);
  });

  it('waits 1 s before reconnecting a connection that had opened', async () => {
    const { sockets, sleep, done } = start([LIQS]);
    sockets[0].emit('open');
    sockets[0].emit('close', 4409, 'server_catching_up');
    await vi.waitFor(() => expect(sockets).toHaveLength(2));
    expect(sleep).toHaveBeenCalledWith(1000);
    sockets[1].emit('close', 4410, 'replaced');
    await expect(done).resolves.toBe(1);
  });

  it('catchup_unavailable: retries after 1, 2, 4, 8, 15 s, then continues from now and says what it skipped', async () => {
    const { sockets, sleep, log, done } = start([FILLS]);
    const [ws] = sockets;
    ws.emit('open');
    const fail = (cursor) => ws.frame({ type: 'error', id: 'hl_fills', code: 'catchup_unavailable', message: 'catch-up is unavailable right now', cursor });
    for (let i = 1; i <= 5; i += 1) {
      fail(`179317887000${i}-0001`);
      await vi.waitFor(() => expect(ws.sent).toHaveLength(1 + i));
      expect(ws.sent.at(-1).cursor).toBe(`179317887000${i}-0001`);
    }
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000, 4000, 8000, 15000]);
    fail('1793178870006-0001');
    expect(ws.sent).toHaveLength(7);
    expect(ws.sent.at(-1)).toEqual({ action: 'subscribe', id: 'hl_fills', channel: 'hl.fills', filter: { coin: ['BTC'] } });
    expect(log.join('\n')).toMatch(/SKIPPED.*vike-data stream events hl\.fills --cursor 1793178870006-0001/);
    ws.emit('close', 4410, 'replaced');
    await expect(done).resolves.toBe(1);
  });

  it('stdout full: pauses the socket, still answers pings, resumes on drain', async () => {
    const { sockets, drains, done } = start([FILLS], { full: true });
    const [ws] = sockets;
    ws.emit('open');
    ws.frame({ type: 'event', ids: ['hl_fills'], channel: 'hl.fills', cursor: '1793178871012-0004', event: {} });
    expect(ws.paused).toBe(true);
    ws.frame({ type: 'ping' });
    expect(ws.sent.at(-1)).toEqual({ action: 'pong' });
    expect(drains).toHaveLength(1);
    drains[0]();
    expect(ws.paused).toBe(false);
    ws.emit('close', 4410, 'replaced');
    await expect(done).resolves.toBe(1);
  });

  it('4401 as a close stops too', async () => {
    const { sockets, done } = start([LIQS]);
    sockets[0].emit('open');
    sockets[0].emit('close', 4401, 'unauthorized');
    await expect(done).resolves.toBe(1);
    expect(sockets).toHaveLength(1);
  });
});
