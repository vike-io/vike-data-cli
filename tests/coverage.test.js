// Command-coverage regression test.
//
// Hardcodes the list of commands we promise to ship. If anyone deletes
// or renames a command in src/commands/ without updating this file, the
// test fails. Keeps the schema honest.

import { describe, it, expect } from 'vitest';

const EXPECTED_TOP_LEVEL = [
  'token', 'wallet', 'perp', 'options', 'alerts',
  'polymarket', 'web', 'labels',
  'init', 'install', 'doctor', 'schema', 'login', 'logout',
];

const EXPECTED_SUBCMDS = {
  token: ['search', 'transfers', 'screener', 'holders'],
  wallet: ['summary', 'discover', 'ens',
           'counterparties', 'pnl-history', 'balances'],
  perp: ['funding', 'spreads', 'top-traders', 'find-position'],
  options: ['flow'],
  alerts: ['list', 'channels', 'create', 'edit', 'delete', 'register-webhook'],
  polymarket: ['markets', 'market', 'wallet', 'smart-money'],
  web: ['search', 'fetch'],
};

describe('command coverage', () => {
  it.each(EXPECTED_TOP_LEVEL)('top-level command exists: vike %s', async (name) => {
    // Walk each registerXxx module and make sure it declares the expected
    // name. We do this via dynamic import of the central index module.
    // Indirect, but cheap.
    const { Command } = await import('commander');
    const program = new Command();
    const registers = await loadAllRegisters();
    for (const fn of Object.values(registers)) fn(program);
    const found = program.commands.find((c) => c.name() === name || c.aliases().includes(name));
    expect(found, `expected top-level command "${name}"`).toBeTruthy();
  });

  it.each(Object.entries(EXPECTED_SUBCMDS))(
    'subcommands for vike %s',
    async (group, subs) => {
      const { Command } = await import('commander');
      const program = new Command();
      const registers = await loadAllRegisters();
      for (const fn of Object.values(registers)) fn(program);
      const cmd = program.commands.find(
        (c) => c.name() === group || c.aliases().includes(group),
      );
      expect(cmd, `expected group "${group}"`).toBeTruthy();
      const subNames = cmd.commands.map((c) => c.name());
      for (const sub of subs) {
        expect(subNames, `${group} should expose ${sub}`).toContain(sub);
      }
    },
  );
});

async function loadAllRegisters() {
  return {
    registerToken: (await import('../src/commands/token.js')).registerToken,
    registerWallet: (await import('../src/commands/wallet.js')).registerWallet,
    registerPerp: (await import('../src/commands/perp.js')).registerPerp,
    registerOptions: (await import('../src/commands/options.js')).registerOptions,
    registerAlerts: (await import('../src/commands/alerts.js')).registerAlerts,
    registerPolymarket: (await import('../src/commands/polymarket.js')).registerPolymarket,
    registerLabels: (await import('../src/commands/labels.js')).registerLabels,
    registerWeb: (await import('../src/commands/web.js')).registerWeb,
    registerInit: (await import('../src/commands/init.js')).registerInit,
    registerInstall: (await import('../src/commands/install.js')).registerInstall,
    registerDoctor: (await import('../src/commands/doctor.js')).registerDoctor,
    registerSchema: (await import('../src/commands/schema.js')).registerSchema,
    registerLogin: (await import('../src/commands/auth.js')).registerLogin,
    registerLogout: (await import('../src/commands/auth.js')).registerLogout,
  };
}
