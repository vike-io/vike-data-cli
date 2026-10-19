// `vike-data install` — verifies multi-IDE skill installer:
// - writes SKILL.md content to each requested target
// - is idempotent (re-running --cursor doesn't duplicate)
// - replaces only the marked block when the target file pre-exists

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = resolve(fileURLToPath(import.meta.url), '..', '..', 'src', 'index.js');

function run(args, cwd) {
  return spawnSync(process.execPath, [CLI, 'install', ...args], {
    cwd,
    env: { ...process.env, VIKE_NO_TELEMETRY: '1', VIKE_NO_UPDATE_CHECK: '1' },
    encoding: 'utf8',
  });
}

describe('vike-data install', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'vike-install-')); });
  afterEach(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } });

  it('errors when no target is given', () => {
    const r = run([], dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/No target selected/);
  });

  it('creates .cursorrules with the skill block', () => {
    const r = run(['--cursor', '--cwd', dir], dir);
    expect(r.status ?? 0).toBe(0);
    const p = join(dir, '.cursorrules');
    expect(existsSync(p)).toBe(true);
    const body = readFileSync(p, 'utf8');
    expect(body).toContain('<!-- vike-skill:begin -->');
    expect(body).toContain('<!-- vike-skill:end -->');
    expect(body).toMatch(/name: vike/);
  });

  it('is idempotent — second run replaces the block, does not duplicate', () => {
    run(['--cursor', '--cwd', dir], dir);
    run(['--cursor', '--cwd', dir], dir);
    const body = readFileSync(join(dir, '.cursorrules'), 'utf8');
    const begins = body.match(/vike-skill:begin/g) || [];
    const ends = body.match(/vike-skill:end/g) || [];
    expect(begins.length).toBe(1);
    expect(ends.length).toBe(1);
  });

  it('preserves user content outside the skill block', () => {
    const p = join(dir, 'AGENTS.md');
    writeFileSync(p, '# user-owned agents file\n\nKeep this line.\n');
    run(['--agents', '--cwd', dir], dir);
    const body = readFileSync(p, 'utf8');
    expect(body).toContain('Keep this line.');
    expect(body).toContain('<!-- vike-skill:begin -->');
  });

  it('--all writes to every target (under cwd) at once', () => {
    const r = run(['--all', '--cwd', dir], dir);
    expect(r.status ?? 0).toBe(0);
    expect(existsSync(join(dir, '.cursorrules'))).toBe(true);
    expect(existsSync(join(dir, '.github', 'copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(true);
    // --all also writes ~/.claude/skills/vike/SKILL.md — that's outside cwd
    // and we don't want to touch the real user homedir in tests, so we just
    // assert stdout reports 4 installed targets.
    expect(r.stdout).toMatch(/Installed 4 target\(s\)/);
  });
});
