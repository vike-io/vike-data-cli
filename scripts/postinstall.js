// Postinstall — print a friendly setup hint on global install only.
//
// Three defensive guards:
// 1. Local installs (`npm i @vike-io/cli` inside a project) get nothing —
//    the hint would be noise. Only global installs (`-g`) print.
// 2. Non-TTY environments (CI, scripts, docker build) get nothing —
//    nothing in here is interactive, but defensively short-circuit so a
//    future maintainer can't accidentally prompt and hang `npm ci`.
// 3. Any error is swallowed — postinstall must NEVER break `npm install`.
//
// Honors $CI and npm's --silent / loglevel=silent.

const isGlobal = String(process.env.npm_config_global || '') === 'true';
const hasTTY = Boolean(process.stdout.isTTY) && Boolean(process.stderr.isTTY);
const isQuiet = process.env.CI ||
                process.env.npm_config_loglevel === 'silent' ||
                process.env.npm_config_loglevel === 'error';

if (!isGlobal || !hasTTY || isQuiet) {
  process.exit(0);
}

try {
  const lines = [
    '',
    '  @vike-io/cli installed.',
    '',
    '  Next steps:',
    '    vike-data init                  — interactive setup',
    '    vike-data doctor                — verify your install',
    '    vike-data token search BTC      — your first query',
    '',
    '  Docs:    https://vike.io/data/',
    '  API key: https://vike.io/account?tab=api-keys',
    '',
  ];
  process.stdout.write(lines.join('\n'));
} catch {
  // Postinstall must not fail an npm install. Swallow everything.
}
process.exit(0);
