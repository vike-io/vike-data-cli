import { readFileSync } from 'node:fs';
import { callTool } from '../mcp-client.js';
import { emitError } from '../format.js';

export function registerCall(program) {
  program
    .command('call <tool>')
    .description('Call any MCP tool by name and print its raw result (see `vike-data schema --pretty` for the tools and their arguments)')
    .option('--args <json>', 'Tool arguments as a JSON object, e.g. \'{"symbol":"BTC"}\'')
    .option('--args-file <path>', 'Read the arguments JSON from a file (- for stdin)')
    .option('--timeout <s>', 'Seconds to wait for the answer', '60')
    .option('--json', 'Errors as JSON on stdout (the result is JSON either way)')
    .action(async (tool, opts) => {
      try {
        const text = opts.argsFile !== undefined
          ? readFileSync(opts.argsFile === '-' ? 0 : opts.argsFile, 'utf8')
          : (opts.args ?? '{}');
        let args;
        try { args = JSON.parse(text); } catch (err) {
          throw new Error(`arguments are not valid JSON: ${err.message}`);
        }
        if (!args || typeof args !== 'object' || Array.isArray(args)) {
          throw new Error('arguments must be a JSON object, e.g. {"address":"0x..."}');
        }
        const seconds = Number(opts.timeout);
        if (!(seconds > 0)) throw new Error(`--timeout must be a positive number of seconds, got ${opts.timeout}`);
        const r = await callTool(tool, args, { raw: true, timeoutMs: seconds * 1000 });
        process.stdout.write((typeof r === 'string' ? r : JSON.stringify(r)) + '\n');
      } catch (err) { emitError(err, opts); }
    });
}
