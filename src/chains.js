// Central chain registry. Every command that takes a --chain flag should
// import EVM_CHAINS or ALL_CHAINS from here. Adding a chain = one edit.

export const EVM_CHAINS = [
  'ethereum',
  'bsc',
  'base',
  'arbitrum',
  'polygon',
  'optimism',
  'hyperevm',
];

export const NON_EVM_CHAINS = [
  'bitcoin',
  'solana',
  'tron',
  'xmr',
  'zec',
  'dash',
];

export const ALL_CHAINS = [...EVM_CHAINS, ...NON_EVM_CHAINS];

// Chains the wallet_* tools currently support (subset of EVM_CHAINS where
// we have indexed transfers + labels). Used by --chain validation in
// commands like `wallet summary` / `wallet counterparties` / etc.
export const WALLET_CHAINS = ['ethereum', 'bsc', 'base'];

// Chain abbreviation map: short → canonical. We accept both forms from
// CLI input and normalise to canonical before sending to MCP.
export const CHAIN_ALIASES = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  bsc: 'bsc',
  bnb: 'bsc',
  base: 'base',
  arb: 'arbitrum',
  arbitrum: 'arbitrum',
  poly: 'polygon',
  polygon: 'polygon',
  op: 'optimism',
  optimism: 'optimism',
  hyper: 'hyperevm',
  hyperevm: 'hyperevm',
  btc: 'bitcoin',
  bitcoin: 'bitcoin',
  sol: 'solana',
  solana: 'solana',
  tron: 'tron',
  trx: 'tron',
  xmr: 'xmr',
  monero: 'xmr',
  zec: 'zec',
  zcash: 'zec',
  dash: 'dash',
};

export function normaliseChain(input, fallback = 'ethereum') {
  if (!input) return fallback;
  const key = String(input).toLowerCase().trim();
  return CHAIN_ALIASES[key] ?? input;
}

// Address-format expectations per chain. Used by `vike-data doctor` and
// future input validation. EVM = 0x + 40 hex; Solana = base58 32-44 chars;
// BTC = various encodings; privacy chains = chain-specific.
export const ADDRESS_FORMATS = {
  ethereum: '0x + 40 hex chars',
  bsc: '0x + 40 hex chars',
  base: '0x + 40 hex chars',
  arbitrum: '0x + 40 hex chars',
  polygon: '0x + 40 hex chars',
  optimism: '0x + 40 hex chars',
  hyperevm: '0x + 40 hex chars',
  solana: 'base58, 32-44 chars',
  bitcoin: 'bech32 / P2PKH / P2SH',
  tron: 'base58 starting with T',
  xmr: 'monero address (95 chars)',
  zec: 'zcash transparent or shielded',
  dash: 'P2PKH starting with X',
};

export function isEvmAddress(addr) {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
}
