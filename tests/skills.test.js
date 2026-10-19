// Skill-pack integrity: the registry, the directories and the cross-references
// must agree, so a merge or rename cannot leave a skill pointing at a removed one.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');

const dirs = readdirSync(SKILLS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(SKILLS, d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();
const read = (d) => readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8');

// Tokens shaped like a skill name that are not skills (the binary, the npm scope,
// a webhook example URL and its User-Agent).
const NOT_SKILLS = new Set(['vike-data', 'vike-io', 'vike-hook', 'vike-alerts', 'vike-alert']);

describe('skills', () => {
  it.each(dirs)('%s: frontmatter name equals its directory', (d) => {
    expect(read(d)).toMatch(new RegExp(`^---\\nname: ${d}\\n`));
  });

  it('skills.sh.json lists every skill exactly once and nothing else', () => {
    const reg = JSON.parse(readFileSync(join(ROOT, 'skills.sh.json'), 'utf8'));
    const listed = reg.groupings.flatMap((g) => g.skills).sort();
    expect(listed).toEqual(dirs);
  });

  it.each(dirs)('%s: names only skills that exist', (d) => {
    const known = new Set(dirs);
    const dead = [...new Set(read(d).match(/\bvike-[a-z][a-z0-9-]*/g) ?? [])]
      .filter((t) => !NOT_SKILLS.has(t) && !known.has(t));
    expect(dead, `${d} references removed skills`).toEqual([]);
  });

  it.each(dirs)('%s: grants and requires the real binary, vike-data', (d) => {
    const body = read(d);
    expect(body).not.toMatch(/Bash\(vike:/);
    expect(body).not.toMatch(/bins: \[vike\]/);
  });

  it('README states the real skill count', () => {
    expect(readFileSync(join(ROOT, 'README.md'), 'utf8'))
      .toContain(`**${dirs.length} skill playbooks**`);
  });
});
