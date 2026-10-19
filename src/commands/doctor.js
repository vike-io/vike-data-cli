import { getApiKey, getEndpoint } from '../auth.js';
import { ping, listTools } from '../mcp-client.js';

export function registerDoctor(program) {
  program
    .command('doctor')
    .description('Diagnose CLI setup, endpoint reachability, and tool availability')
    .action(async () => {
      const checks = [];

      // 1. Node version
      const nodeVer = process.version;
      const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
      checks.push({
        name: 'Node runtime',
        ok: major >= 20,
        detail: `${nodeVer} (need >= 20.0.0)`,
      });

      // 2. API key
      const key = getApiKey();
      checks.push({
        name: 'API key',
        ok: Boolean(key),
        detail: key
          ? `${key.slice(0, 8)}... (source: ${process.env.VIKE_API_KEY ? 'env' : 'config'})`
          : 'Not set. Run `vike-data init` or `vike-data login --api-key <key>`',
      });

      // 3. Endpoint
      const endpoint = getEndpoint();
      checks.push({
        name: 'Endpoint URL',
        ok: true,
        detail: endpoint,
      });

      // 4. Connectivity — HTTP 200 means endpoint up; auth error is separate concern
      try {
        const { status, body } = await ping({ apiKey: key ?? undefined });
        const reachable = status === 200;
        const authed = reachable && !body.error;
        let detail;
        if (authed) {
          detail = `OK · server=${body?.result?.serverInfo?.name ?? '?'} v${body?.result?.serverInfo?.version ?? '?'}`;
        } else if (reachable) {
          detail = `Endpoint reachable; ${body?.error?.message ?? 'no auth'}`;
        } else {
          detail = `HTTP ${status} · ${JSON.stringify(body).slice(0, 200)}`;
        }
        checks.push({ name: 'MCP connectivity', ok: reachable, detail });
      } catch (err) {
        checks.push({ name: 'MCP connectivity', ok: false, detail: err.message });
      }

      // 5. Tool list (requires auth)
      if (key) {
        try {
          const tools = await listTools();
          checks.push({
            name: 'Tool registry',
            ok: tools.length > 0,
            detail: `${tools.length} tools available`,
          });
        } catch (err) {
          checks.push({ name: 'Tool registry', ok: false, detail: err.message });
        }
      } else {
        checks.push({ name: 'Tool registry', ok: false, detail: 'Skipped (no API key)' });
      }

      // Render
      const PASS = '✔';
      const FAIL = '✗';
      for (const c of checks) {
        const mark = c.ok ? PASS : FAIL;
        console.log(`${mark}  ${c.name.padEnd(20)} ${c.detail}`);
      }
      const failed = checks.filter((c) => !c.ok).length;
      if (failed > 0) {
        console.log(`\n${failed} check(s) failed.`);
        process.exitCode = 1;
      } else {
        console.log('\nAll checks passed. Try: vike-data token search BTC');
      }
    });
}
