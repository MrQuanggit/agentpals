#!/usr/bin/env node
// agentpals hook for Claude Code and Codex CLI.
// The agent pipes the hook payload (JSON) on stdin; we forward a *minimal* copy to the
// local AgentPals server at /hook/<source>. Usage: node claude-hook.mjs --agentpals [--source codex]
//
// Rules: never block or fail the agent (always exit 0, no output, short timeout), and never
// forward more than the UI needs — file contents (Write/Edit bodies, patches) stay on the machine
// only as file names.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const home = process.env.AGENTPALS_HOME ?? join(homedir(), '.agentpals');
const port = Number(process.env.AGENTPALS_PORT ?? 4777);
const i = process.argv.indexOf('--source');
const source = i > -1 && process.argv[i + 1] === 'codex' ? 'codex' : 'claude';

const MAX_STDIN = 4 * 1024 * 1024;
const MAX_STR = 500;
const TOP_KEYS = ['hook_event_name', 'session_id', 'cwd', 'tool_name', 'message'];
const INPUT_KEYS = ['file_path', 'notebook_path', 'command', 'cmd', 'pattern', 'url', 'query'];

const cap = (v) => (typeof v === 'string' ? v.slice(0, MAX_STR) : Array.isArray(v) ? v.slice(0, 20).map(cap) : undefined);

/** Keep only `*** Update File: x` style header lines from a patch. */
function patchHeaders(text) {
  return text
    .split('\n')
    .filter((l) => /^\*\*\* (?:Update|Add|Delete) File: /.test(l))
    .slice(0, 20)
    .map((l) => l.slice(0, MAX_STR))
    .join('\n');
}

export function minimize(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const out = {};
  for (const k of TOP_KEYS) if (typeof payload[k] === 'string') out[k] = payload[k].slice(0, MAX_STR);
  const input = payload.tool_input;
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const ti = {};
    for (const k of INPUT_KEYS) {
      // Codex sends an apply_patch as { command: "<whole patch>" }: keep only its file header lines.
      const isPatch = typeof input[k] === 'string' && (payload.tool_name === 'apply_patch' || input[k].includes('*** Begin Patch'));
      const v = isPatch ? patchHeaders(input[k]) : cap(input[k]);
      if (v !== undefined) ti[k] = v;
    }
    for (const k of ['input', 'patch']) {
      if (typeof input[k] === 'string') ti[k] = patchHeaders(input[k]);
    }
    out.tool_input = ti;
  }
  return out;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > MAX_STDIN) return;
  }
  const body = minimize(JSON.parse(input));
  if (!body) return;
  const token = readFileSync(join(home, 'token'), 'utf8').trim();
  await fetch(`http://127.0.0.1:${port}/hook/${source}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(1000),
  });
}

// Run only when executed directly (the test suite imports `minimize`).
if (process.argv.includes('--agentpals')) {
  main().catch(() => {}).finally(() => process.exit(0));
}
