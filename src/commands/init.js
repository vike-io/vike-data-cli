import { saveApiKey, getApiKey } from '../auth.js';
import { ping } from '../mcp-client.js';
import { emit } from '../format.js';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export function registerInit(program) {
  program
    .command('init')
    .description('Interactive setup: save your API key and verify connectivity')
    .option('--api-key <key>', 'Skip the prompt by passing the key')
    .action(async (opts) => {
      let key = opts.apiKey ?? getApiKey();

      if (!key) {
        const rl = createInterface({ input: stdin, output: stdout });
        try {
          console.log('Get your API key at https://vike.io/account?tab=api-keys');
          key = (await rl.question('Paste your API key (vk_...): ')).trim();
        } finally {
          rl.close();
        }
      }

      if (!key) {
        console.error('No API key provided. Aborting.');
        process.exitCode = 1;
        return;
      }

      const path = saveApiKey(key);
      console.log(`Saved to ${path}`);

      console.log('Verifying connection to vike.io/mcp ...');
      const { status, body } = await ping({ apiKey: key });
      if (status !== 200 || body?.error) {
        console.error(`Endpoint returned HTTP ${status}: ${JSON.stringify(body)}`);
        process.exitCode = 1;
        return;
      }
      const info = body?.result?.serverInfo ?? {};
      emit({
        ok: true,
        server: info.name,
        version: info.version,
        protocol: body?.result?.protocolVersion,
        next: 'Try: vike-data token search BTC',
      });
    });
}
