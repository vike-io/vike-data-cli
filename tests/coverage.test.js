// Command-coverage regression test.
//
// Hardcodes the list of commands we promise to ship. If anyone deletes
// or renames a command in src/commands/ without updating this file, the
// test fails. Keeps the schema honest.

import { describe, it, expect } from 'vitest';

const EXPECTED_TOP_LEVEL = [
  'token', 'wallet', 'perp', 'alerts',
  'polymarket', 'candles', 'labels',
  'init', 'install', 'doctor', 'schema', 'login', 'logout', 'whoami',
  'hl', 'stream', 'call', 'search',
];

const EXPECTED_SUBCMDS = {
  token: ['search', 'transfers', 'screener', 'holders'],
  wallet: ['summary', 'transactions', 'compare', 'trace', 'batch', 'discover', 'ens',
           'counterparties', 'pnl-history', 'balances', 'first-funder', 'exchange-usage'],
  perp: ['funding', 'spreads', 'top-traders', 'find-position'],
  alerts: ['list', 'channels', 'create', 'edit', 'delete', 'register-webhook',
           'events', 'resend', 'rotate-secret', 'test-webhook'],
  polymarket: ['markets', 'market', 'wallet', 'smart-money', 'market-trades', 'tape', 'orderbook',
               'market-stats', 'settlement', 'settlements', 'chainlink-prices', 'archive', 'leaderboard'],
  candles: ['hl', 'polymarket'],
  hl: ['cohort-metrics', 'segments', 'wallet', 'wallet-activity', 'leaderboard', 'liquidations',
       'market', 'builders', 'vaults', 'vault', 'orders', 'twaps', 'ledger', 'leverage-changes',
       'wallet-trades', 'stats', 'hype-holders', 'archive'],
  stream: ['info', 'check', 'events', 'connections'],
};

describe('command coverage', () => {
  it.each(EXPECTED_TOP_LEVEL)('top-level command exists: vike-data %s', async (name) => {
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
    'subcommands for vike-data %s',
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
    registerAlerts: (await import('../src/commands/alerts.js')).registerAlerts,
    registerPolymarket: (await import('../src/commands/polymarket.js')).registerPolymarket,
    registerLabels: (await import('../src/commands/labels.js')).registerLabels,
    registerCandles: (await import('../src/commands/candles.js')).registerCandles,
    registerInit: (await import('../src/commands/init.js')).registerInit,
    registerInstall: (await import('../src/commands/install.js')).registerInstall,
    registerDoctor: (await import('../src/commands/doctor.js')).registerDoctor,
    registerSchema: (await import('../src/commands/schema.js')).registerSchema,
    registerLogin: (await import('../src/commands/auth.js')).registerLogin,
    registerLogout: (await import('../src/commands/auth.js')).registerLogout,
    registerWhoami: (await import('../src/commands/auth.js')).registerWhoami,
    registerHl: (await import('../src/commands/hl.js')).registerHl,
    registerStream: (await import('../src/commands/stream.js')).registerStream,
    registerCall: (await import('../src/commands/call.js')).registerCall,
    registerSearch: (await import('../src/commands/search.js')).registerSearch,
  };
}
