// CLI smoke tests. Exercise --help on every top-level command so we
// catch broken imports / missing exports immediately. Network is NOT
// hit — every command's --help renders without calling the MCP.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(__dirname, '..', 'src', 'index.js');

function run(args) {
  return execFileSync(process.execPath, [ENTRY, ...args], {
    encoding: 'utf8',
    env: { ...process.env, CI: '1', VIKE_NO_TELEMETRY: '1' },
  });
}

describe('cli --help', () => {
  it('top-level help renders', () => {
    expect(run(['--help'])).toMatch(/Usage: vike/);
  });

  it.each([
    ['token'],
    ['wallet'],
    ['perp'],
    ['alerts'],
    ['polymarket'],
    ['candles'],
    ['candles', 'hl', 'BTC'],
    ['candles', 'polymarket', '123'],
    ['init'],
    ['doctor'],
    ['schema'],
    ['labels', '0x0000000000000000000000000000000000000000'],
    ['login'],
    ['logout'],
  ])('vike %s --help', (...cmdParts) => {
    const out = run([...cmdParts, '--help']);
    expect(out).toMatch(/Usage:|Options:/);
  });

  it('--version prints a semver', () => {
    const v = run(['--version']).trim();
    expect(v).toMatch(/^\d+\.\d+\.\d+/);
  });
});
