import { requireApiKey, getEndpoint } from './auth.js';

let _id = 0;
function nextId() { return ++_id; }

export async function callTool(toolName, args = {}, opts = {}) {
  const apiKey = opts.apiKey ?? requireApiKey();
  const endpoint = opts.endpoint ?? getEndpoint();
  const timeoutMs = opts.timeoutMs ?? 60_000;

  const body = {
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'User-Agent': `vike-cli/${process.env.npm_package_version ?? 'dev'}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Network error: ${err.message}`);
  } finally {
    clearTimeout(t);
  }

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Bad response (HTTP ${resp.status}): ${text.slice(0, 200)}`);
  }

  if (json.error) {
    const msg = json.error.message ?? 'Unknown MCP error';
    throw new Error(`MCP error ${json.error.code}: ${msg}`);
  }

  // tools/call returns { content: [{type:'text', text: JSON}], isError }
  const content = json.result?.content?.[0]?.text;
  if (!content) return json.result;
  try { return JSON.parse(content); } catch {
    return content;
  }
}

export async function listTools(opts = {}) {
  const apiKey = opts.apiKey ?? requireApiKey();
  const endpoint = opts.endpoint ?? getEndpoint();
  const body = {
    jsonrpc: '2.0',
    id: nextId(),
    method: 'tools/list',
    params: {},
  };
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify(body),
  });
  const json = await resp.json();
  if (json.error) throw new Error(json.error.message);
  return json.result?.tools ?? [];
}

export async function ping(opts = {}) {
  // /mcp authenticates every method, initialize included: no key gets a
  // JSON-RPC "Invalid or missing API key" error (soon HTTP 401), so fail early.
  const endpoint = opts.endpoint ?? getEndpoint();
  const apiKey = opts.apiKey ?? requireApiKey();
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({
      jsonrpc: '2.0', id: nextId(), method: 'initialize', params: {},
    }),
  });
  return { status: resp.status, body: await resp.json() };
}
