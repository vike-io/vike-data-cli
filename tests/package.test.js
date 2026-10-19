// Pack-and-install smoke test.
//
// Catches the most expensive bug: `npm publish` succeeds but the
// resulting tarball is missing files that runtime needs (typically
// because of an over-narrow `"files"` array in package.json or a typo
// in `.npmignore`). Replays the publish locally and runs `vike-data --help`
// against the extracted tarball.

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');

describe('npm pack', { timeout: 60_000 }, () => {
  it('packs and the resulting tarball has a working bin', () => {
    const work = mkdtempSync(join(tmpdir(), 'vike-pack-'));
    try {
      // 1. Pack inside the work dir so we get a clean tarball + know the name
      execSync(`npm pack "${REPO}"`, { cwd: work, stdio: 'pipe' });
      const tgz = readdirSync(work).find((f) => f.endsWith('.tgz'));
      expect(tgz, 'pack should produce a tarball').toBeTruthy();

      // 2. Install the tarball into a throwaway project
      execSync('npm init -y', { cwd: work, stdio: 'pipe' });
      execSync(`npm install --no-audit --no-fund ./${tgz}`, {
        cwd: work, stdio: 'pipe',
      });

      // 3. The bin must exist + execute --help without error
      const bin = join(work, 'node_modules', '.bin',
                       process.platform === 'win32' ? 'vike-data.cmd' : 'vike-data');
      expect(existsSync(bin), `bin should exist at ${bin}`).toBe(true);

      const out = execSync(`"${bin}" --help`, { cwd: work, encoding: 'utf8' });
      expect(out).toMatch(/Usage: vike-data/);

      // 4. Critical sanity: the skills/ folder ships with the package
      const skillsDir = join(work, 'node_modules', '@vike-io', 'cli', 'skills');
      expect(existsSync(skillsDir), 'skills/ must ship in the tarball').toBe(true);
      const skills = readdirSync(skillsDir).filter((d) => d.startsWith('vike-'));
      expect(skills.length, 'at least 20 skills ship').toBeGreaterThanOrEqual(20);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });
});
