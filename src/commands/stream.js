import WebSocket from 'ws';
import { requireApiKey } from '../auth.js';
import { USER_AGENT, callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { addTool } from './tool-command.js';

// The four event streams on stream.vike.io; a channel belongs to one of them. The protocol (frames,
// close codes, resume) is https://vike.io/docs/data/reference/stream-hl.
export const STREAM_PATHS = ['hl', 'hl-cohorts', 'onchain', 'polymarket'];
const MAX_SUBSCRIPTIONS = 100;          // per connection, the server's cap
const IDLE_MS = 60_000;                 // the server pings every 15 s: a minute of silence is a dead connection
const NUMBER_KEYS = new Set(['min_usd', 'min_amount', 'min_move']);
const ONE_VALUE_KEYS = new Set(['side', 'direction', 'event', 'axis', 'move', 'role']);   // every other key is a list
// No channel list here: the server decides which channels a path serves (`stream info` lists them) and refuses
// an unknown one with `unknown_channel`.
const FATAL_ERRORS = new Set(['bad_subscription', 'unknown_channel', 'rate_limited']);
const FRESH_ERRORS = new Set(['cursor_expired', 'cursor_ahead']);      // resubscribe from now
const RESUME_ERRORS = new Set(['catchup_unavailable', 'replay_too_large']);   // resubscribe from the frame's cursor

// `--filter k=v` pairs -> the subscribe frame's filter object. A list key takes comma-separated values and
// repeats add to it; the server validates the keys and values and names a bad one.
export function parseFilters(pairs = []) {
  const filter = {};
  for (const pair of pairs) {
    const i = pair.indexOf('=');
    if (i < 1) throw new Error(`--filter takes key=value, got ${JSON.stringify(pair)}`);
    const key = pair.slice(0, i).trim();
    const value = pair.slice(i + 1).trim();
    if (NUMBER_KEYS.has(key)) {
      const n = Number(value);
      if (value === '' || !Number.isFinite(n)) throw new Error(`--filter ${key} must be a number, got ${JSON.stringify(value)}`);
      filter[key] = n;
    } else if (value === 'true' || value === 'false') {
      filter[key] = value === 'true';       // a yes/no key, e.g. contract=false on chain.transfers
    } else if (ONE_VALUE_KEYS.has(key)) {
      filter[key] = value;
    } else {
      filter[key] = [...(filter[key] ?? []), ...value.split(',').map((v) => v.trim()).filter(Boolean)];
    }
  }
  return filter;
}

// The later of two cursors; they are fixed-width, so text order is time order.
const later = (a, b) => (b === undefined || (a !== undefined && a >= b) ? a : b);

// Run the subscriptions until a close the CLI must not retry; resolves to the exit code. Events and gap frames go
// to `out` as received (one JSON object per line, so 64-bit integers stay exact); status lines go to `log`.
// Every other end reconnects at once with the last cursor of each subscription.
export async function runStream({
  url, apiKey, subs, out, log,
  WebSocketImpl = WebSocket,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const cursors = new Map(subs.filter((s) => s.cursor).map((s) => [s.id, s.cursor]));
  const headers = { 'X-API-KEY': apiKey, 'User-Agent': USER_AGENT };
  let failures = 0;
  for (;;) {
    const r = await session(WebSocketImpl, url, headers, subs, cursors, out, log);
    if (r.exit !== undefined) return r.exit;
    failures = r.opened ? 0 : failures + 1;
    // The first retry is immediate; a handshake that keeps failing (stream restarting) waits 1, 2, 4 ... 15 s.
    if (failures > 1) await sleep(Math.min(15_000, 1000 * 2 ** (failures - 2)));
  }
}

function session(WS, url, headers, subs, cursors, out, log) {
  return new Promise((resolve) => {
    let opened = false;
    let done = false;
    let idle;
    const ws = new WS(url, { headers, handshakeTimeout: 30_000 });
    const finish = (r) => {
      if (done) return;
      done = true;
      clearTimeout(idle);
      resolve({ opened, ...r });
    };
    const stop = (exit) => { finish({ exit }); ws.terminate(); };
    const alive = () => {
      clearTimeout(idle);
      idle = setTimeout(() => { log(`no frame for ${IDLE_MS / 1000} s; connecting again`); ws.terminate(); }, IDLE_MS);
    };
    const subscribe = (s) => {
      const msg = { action: 'subscribe', id: s.id, channel: s.channel };
      if (s.filter) msg.filter = s.filter;
      if (cursors.has(s.id)) msg.cursor = cursors.get(s.id);
      ws.send(JSON.stringify(msg));
    };

    ws.on('unexpected-response', (_req, res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const status = res.statusCode;
        let why = body.slice(0, 200);
        try { const j = JSON.parse(body); why = j.message ?? j.error?.message ?? why; } catch { /* HTML or empty */ }
        // 401: the key; 403 / 410: the wrong address. Anything else (503, Cloudflare 521/522) is worth another try.
        if ([401, 403, 410].includes(status)) {
          log(`refused: HTTP ${status} ${why}`);
          stop(1);
        } else {
          log(`refused: HTTP ${status} ${why}; connecting again`);
          stop(undefined);
        }
      });
    });
    ws.on('error', (err) => { if (!done) log(`connection error: ${err.message}`); });
    ws.on('open', () => {
      opened = true;
      alive();
      for (const s of subs) subscribe(s);
    });
    ws.on('message', (data) => {
      if (done) return;
      alive();
      const text = String(data);
      let f;
      try { f = JSON.parse(text); } catch { return; }
      if (f.type === 'ping') {
        ws.send('{"action":"pong"}');
      } else if (f.type === 'event') {
        out(text);
        for (const id of f.ids ?? []) cursors.set(id, later(cursors.get(id), f.cursor));
      } else if (f.type === 'gap') {
        // About the channel, not one subscription: every subscription on it moves past the window.
        out(text);
        for (const s of subs) if (s.channel === f.channel) cursors.set(s.id, later(cursors.get(s.id), f.cursor));
      } else if (f.type === 'subscribed') {
        if (f.cursor) cursors.set(f.id, later(cursors.get(f.id), f.cursor));
        log(`subscribed ${f.id} to ${f.channel} at ${f.cursor} (replay: ${f.replay?.from ?? 'none'})`);
      } else if (f.type === 'error') {
        log(`error: ${text}`);
        const sub = subs.find((s) => s.id === f.id);
        if (FATAL_ERRORS.has(f.code)) {
          stop(1);
        } else if (sub && FRESH_ERRORS.has(f.code)) {
          cursors.delete(sub.id);
          subscribe(sub);
        } else if (sub && RESUME_ERRORS.has(f.code)) {
          if (f.code === 'replay_too_large' && (!f.cursor || f.cursor === cursors.get(sub.id))) {
            log('the replay is too large even from the last cursor: narrow the filter');
            stop(1);
            return;
          }
          if (f.cursor) cursors.set(sub.id, f.cursor);
          subscribe(sub);
        }
        // slow_consumer, server_catching_up, replaced, memory_backstop, ping_timeout: the close follows.
      }
    });
    ws.on('close', (code, reason) => {
      if (done) return;
      const why = String(reason ?? '');
      if (code === 4410) {
        log('replaced (4410): a newer connection of this key took over this address (one connection per key '
          + 'per address, 3 per account). Not reconnecting: give each program its own key.');
        finish({ exit: 1 });
      } else if (code === 4401) {
        log(`unauthorized (4401)${why ? `: ${why}` : ''}`);
        finish({ exit: 1 });
      } else {
        log(`closed (${code}${why ? ` ${why}` : ''}); connecting again from the last cursors`);
        finish({});
      }
    });
  });
}

const FILTER_OPTION = ['--filter <key=value...>', 'Filter, repeatable: coin=BTC,ETH  min_usd=50000  wallet=0x...  side=buy'];

export function registerStream(program) {
  // `stream check --filter ...`: the subcommand's flags must stay the subcommand's, not go to `stream <path>`,
  // which has the same names. Commander needs positional options on the parent chain for that; the root has
  // only --version and --help, which keep working before a command name.
  program.enablePositionalOptions();
  const cmd = program
    .command('stream <path>')
    .enablePositionalOptions()
    .description(`Print live events as NDJSON from wss://stream.vike.io/v1/stream/<path> (${STREAM_PATHS.join(', ')}); reconnects and resumes by itself`)
    // Checked in the action, not requiredOption: commander checks a parent's required options for its subcommands too.
    .option('--channel <channel...>', 'Required. Channel(s), one subscription each, e.g. hl.fills hl.liquidations (hl), chain.transfers (onchain), pm.trades (polymarket)')
    .option(FILTER_OPTION[0], `${FILTER_OPTION[1]} (applies to every --channel)`)
    .option('--cursor <cursor>', 'Resume from this cursor (from a frame, at most 3 days old) instead of starting now')
    .action(async (path, opts) => {
      try {
        if (!STREAM_PATHS.includes(path)) {
          throw new Error(`unknown stream ${JSON.stringify(path)}: use one of ${STREAM_PATHS.join(', ')}`);
        }
        if (!opts.channel) throw new Error('--channel is required, e.g. --channel hl.fills (`vike-data stream info` lists the channels)');
        const channels = [...new Set(opts.channel)];
        if (channels.length > MAX_SUBSCRIPTIONS) {
          throw new Error(`at most ${MAX_SUBSCRIPTIONS} subscriptions per connection, got ${channels.length}`);
        }
        const filter = parseFilters(opts.filter);
        const subs = channels.map((channel) => ({
          id: channel.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32),
          channel,
          filter: Object.keys(filter).length ? filter : undefined,
          cursor: opts.cursor,
        }));
        const log = (line) => process.stderr.write(`vike-data stream: ${line}\n`);
        log(`one connection per key on each address: another program streaming ${path} with this key replaces this one`);
        process.exitCode = await runStream({
          url: `wss://stream.vike.io/v1/stream/${path}`,
          apiKey: requireApiKey(),
          subs,
          out: (line) => process.stdout.write(line + '\n'),
          log,
        });
      } catch (err) { emitError(err, opts); }
    });

  // The stream's MCP tools: no socket, so no connection of the key is replaced.
  addTool(cmd, 'info', {
    tool: 'stream_info',
    desc: 'Every path, channel and filter key, the limits and close codes, from the server\'s own registry',
  });

  cmd
    .command('check <channel>')
    .description('Check a channel and filter with the stream server\'s own validator, without connecting (exit 1 if refused)')
    .option(...FILTER_OPTION)
    .option('--path <path>', `The endpoint the connection would use: ${STREAM_PATHS.join(' | ')} (default the channel's own)`)
    .option('--json', 'Emit JSON')
    .action(async (channel, opts) => {
      try {
        const filter = parseFilters(opts.filter);
        const r = await callTool('stream_check_filter', {
          channel, filter: Object.keys(filter).length ? filter : undefined, path: opts.path,
        });
        emit(r, opts);
        if (r?.valid === false) process.exitCode = 1;
      } catch (err) { emitError(err, opts); }
    });

  cmd
    .command('events <channel>')
    .description('Stored events of one channel after a cursor, oldest first (the REST catch-up, kept 3 days)')
    .option(...FILTER_OPTION)
    .option('--cursor <cursor>', 'next_cursor of the previous page, or a frame\'s cursor (omit for the oldest kept)')
    .option('--since-ms <ms>', 'Start after this arrival time, epoch ms (instead of --cursor)')
    .option('--limit <n>', 'Events per page, 1-1000 (default 200)')
    .option('--json', 'Emit JSON')
    .action(async (channel, opts) => {
      try {
        const filter = parseFilters(opts.filter);
        emit(await callTool('stream_events', {
          channel,
          filter: Object.keys(filter).length ? filter : undefined,
          cursor: opts.cursor,
          since_ms: opts.sinceMs,
          limit: opts.limit,
        }), opts);
      } catch (err) { emitError(err, opts); }
    });

  addTool(cmd, 'connections', {
    tool: 'stream_connections',
    desc: 'Your account\'s recent stream connections: path, key, state, close code (4410 = replaced), channels',
    options: [
      ['--hours <n>', 'How far back, 1-720 (default 168)'],
      ['--limit <n>', 'Connections, newest first, 1-1000 (default 50)'],
    ],
  });
}
