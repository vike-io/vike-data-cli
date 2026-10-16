import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';

export function registerLabels(program) {
  // `vike labels <address>` — multi-source label provenance for one wallet
  program
    .command('labels <address>')
    .description('Multi-source label cascade for a wallet (10+ providers + in-house heuristic + consensus view)')
    .option('--json', 'Emit JSON')
    .action(async (address, opts) => {
      try {
        const r = await callTool('wallet_label_provenance', { address });
        emit(r, opts);
      } catch (err) { emitError(err, opts); }
    });
}
