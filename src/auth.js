import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.vike');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getApiKey() {
  // Resolution order: env var > config file
  const envKey = process.env.VIKE_API_KEY;
  if (envKey) return envKey;

  if (!existsSync(CONFIG_FILE)) return null;
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    return cfg.api_key || null;
  } catch {
    return null;
  }
}

export function saveApiKey(apiKey) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  let cfg = {};
  if (existsSync(CONFIG_FILE)) {
    try { cfg = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch { /* ignore */ }
  }
  cfg.api_key = apiKey;
  cfg.saved_at = new Date().toISOString();
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return CONFIG_FILE;
}

export function clearApiKey() {
  if (!existsSync(CONFIG_FILE)) return false;
  unlinkSync(CONFIG_FILE);
  return true;
}

export function getEndpoint() {
  return process.env.VIKE_MCP_URL || 'https://vike.io/mcp';
}

export function requireApiKey() {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      'No API key. Run `vike-data login --api-key <key>` or set VIKE_API_KEY. ' +
      'Get a key at https://vike.io/account?tab=api-keys',
    );
  }
  return key;
}
