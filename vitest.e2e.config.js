import { defineConfig } from 'vitest/config';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no dependency). Lets `npm run test:e2e` pick up
// VIKE_API_KEY (and friends) from a gitignored .env without exporting it
// by hand. Lines are KEY=VALUE; #-comments and surrounding quotes are
// stripped. Real process.env still wins (see env merge below).
function loadDotenv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

// Real, already-exported env vars win over .env (standard dotenv behavior),
// so `VIKE_API_KEY=… npm run test:e2e` overrides the file.
const fileEnv = loadDotenv(join(__dirname, '.env'));
for (const k of Object.keys(fileEnv)) {
  if (process.env[k] !== undefined) delete fileEnv[k];
}

// End-to-end tests — hit the live MCP at https://vike.io/mcp (or whatever
// VIKE_MCP_URL points at). Off by default — only runs via `npm run test:e2e`.
// Long timeout: some tools (token_holders, wallet_trace) routinely take
// 10–20s.
export default defineConfig({
  test: {
    include: ['**/*.e2e.test.{js,mjs}', 'tests/e2e/**/*.{test,spec}.{js,mjs}'],
    exclude: ['**/node_modules/**'],
    testTimeout: 120_000,
    env: {
      VIKE_NO_TELEMETRY: '1',
      DO_NOT_TRACK: '1',
      ...fileEnv,
    },
  },
});
