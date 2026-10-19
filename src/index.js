#!/usr/bin/env node
import { Command } from 'commander';
import { registerToken } from './commands/token.js';
import { registerWallet } from './commands/wallet.js';
import { registerPerp } from './commands/perp.js';
import { registerAlerts } from './commands/alerts.js';
import { registerPolymarket } from './commands/polymarket.js';
import { registerLabels } from './commands/labels.js';
import { registerCandles } from './commands/candles.js';
import { registerHl } from './commands/hl.js';
// New wallet subcommands (counterparties, pnl-history, balances, ens) are
// added under registerWallet.
import { registerInit } from './commands/init.js';
import { registerInstall } from './commands/install.js';
import { registerDoctor } from './commands/doctor.js';
import { registerSchema } from './commands/schema.js';
import { registerLogin, registerLogout } from './commands/auth.js';
import { readPackageVersion } from './util.js';
import {
  getUpdateNotification,
  getUpgradeNotice,
  scheduleUpdateCheck,
} from './update-check.js';
import { trackCommandSucceeded, trackCommandFailed } from './telemetry.js';

const version = readPackageVersion();

// Print at-most-once notifications: upgrade-since-last-run, and update-available
// (the latter from the previous background check). Cheap, sync, exits if quiet.
const upgradeNotice = getUpgradeNotice(version);
const updateNotice = getUpdateNotification(version);
if (upgradeNotice) process.stderr.write(upgradeNotice);
if (updateNotice) process.stderr.write(updateNotice);

const program = new Command();

program
  .name('vike-data')
  .description('AI-agent CLI for vike.io on-chain analytics')
  .version(version, '-v, --version', 'Show CLI version');

// Telemetry: time each command from preAction to postAction; failure path is
// caught below via parseAsync().catch().
const _cmdStart = new WeakMap();
program.hook('preAction', (_thisCmd, actionCmd) => {
  _cmdStart.set(actionCmd, Date.now());
});
program.hook('postAction', (_thisCmd, actionCmd) => {
  const t0 = _cmdStart.get(actionCmd);
  trackCommandSucceeded(actionCmd.name(), actionCmd.opts(), {
    durationMs: t0 ? Date.now() - t0 : null,
  });
});

registerLogin(program);
registerLogout(program);
registerInit(program);
registerInstall(program);
registerDoctor(program);
registerSchema(program);
registerToken(program);
registerWallet(program);
registerPerp(program);
registerAlerts(program);
registerPolymarket(program);
registerLabels(program);
registerCandles(program);
registerHl(program);

const _parseT0 = Date.now();
program.parseAsync(process.argv)
  .catch((err) => {
    console.error(`vike: ${err.message ?? err}`);
    process.exitCode = 1;
    const cmd = program.args[0] || 'unknown';
    trackCommandFailed(cmd, {}, {
      errorCode: err?.code || err?.name || 'error',
      durationMs: Date.now() - _parseT0,
    });
  })
  .finally(() => {
    // Fire-and-forget background check, detached subprocess. Survives our exit.
    scheduleUpdateCheck();
  });
