import { callTool } from '../mcp-client.js';
import { emit, emitError } from '../format.js';
import { parseInt10 } from '../util.js';

// Register `<group> <name>` as one thin call to one MCP tool. Every flag the caller sets is
// forwarded under its snake_case parameter name (--opened-within -> opened_within) and an unset
// flag is not sent at all: a view-based tool refuses a parameter its view does not take, and
// the server's own defaults stay the defaults. An optional positional becomes `arg`.
export function addTool(group, name, spec) {
  const { tool, desc, arg, options = [], ints = [], nums = [] } = spec;
  const cmd = group.command(arg ? `${name} <${arg}>` : name).description(desc);
  for (const [flags, text, required] of options) {
    if (required) cmd.requiredOption(flags, text); else cmd.option(flags, text);
  }
  cmd.option('--json', 'Emit JSON');
  cmd.action(async (...received) => {
    received.pop(); // the Command
    const opts = received.pop();
    const args = {};
    if (arg) args[arg.replace(/\.\.\.$/, '')] = received[0];
    for (const [key, value] of Object.entries(opts)) {
      if (value === undefined || key === 'json') continue;
      const param = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      if (ints.includes(key)) args[param] = parseInt10(value, value);
      else if (nums.includes(key)) args[param] = Number.isFinite(parseFloat(value)) ? parseFloat(value) : value;
      else args[param] = value;
    }
    try {
      emit(await callTool(tool, args), opts);
    } catch (err) { emitError(err, opts); }
  });
}
