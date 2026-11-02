import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';

// Register `<group> <spec>` as one call to one MCP tool. `args` names the tool parameters the
// positional arguments of `spec` fill, in order. Each flag is forwarded under its snake_case
// parameter name (--from-ms -> from_ms) and an unset flag is not sent: a view-based tool refuses
// a parameter its view does not take, and the server's defaults stay the defaults. Values go as
// typed; the server casts them and names the fix when one is wrong.
export function addTool(group, spec, { tool, desc, args = [], options = [] }) {
  const cmd = group.command(spec).description(desc);
  for (const [flags, text] of options) cmd.option(flags, text);
  cmd.option('--json', 'Emit JSON');
  cmd.action(async (...received) => {
    received.pop(); // the Command
    const opts = received.pop();
    const payload = {};
    args.forEach((name, i) => { payload[name] = received[i]; });
    for (const [key, value] of Object.entries(opts)) {
      if (value === undefined || key === 'json') continue;
      payload[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
    }
    try {
      emit(await callTool(tool, payload), opts);
    } catch (err) { emitError(err, opts); }
  });
  return cmd;
}
