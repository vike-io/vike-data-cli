import { addTool } from './tool-command.js';

export function registerSearch(program) {
  addTool(program, 'search <q>', {
    tool: 'search',
    args: ['q'],
    desc: 'Search everything by name, symbol, address, ENS name or polymarket.com link: tokens, wallets and entities, HL traders, vaults, builders, Polymarket wallets and markets',
    options: [['--limit <n>', 'Rows per section, 1-20 (default 5)']],
  });
}
