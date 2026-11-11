#!/usr/bin/env node
// agentpals hook for Claude Code.
// Claude Code pipes the hook payload (JSON) on stdin; we forward it to the local
// AgentPals server. It must never block or fail the agent, so every error is swallowed
// and the script always exits 0.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const home = process.env.AGENTPALS_HOME ?? join(homedir(), '.agentpals');
const port = process.env.AGENTPALS_PORT ?? '4777';

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const token = readFileSync(join(home, 'token'), 'utf8').trim();
  await fetch(`http://127.0.0.1:${port}/hook/claude`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: input,
    signal: AbortSignal.timeout(1000),
  });
}

main().catch(() => {}).finally(() => process.exit(0));
