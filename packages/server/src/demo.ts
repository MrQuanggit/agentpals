import { HOST, PORT, getOrCreateToken } from './config.ts';
import type { ClaudeHookPayload } from './providers/claude/mapHook.ts';

type Source = 'claude' | 'codex';

/** Fake Claude Code + Codex sessions, so the office can be tried without running real agents. */
const SESSIONS: Array<{ id: string; source: Source; cwd: string; steps: ClaudeHookPayload[] }> = [
  {
    id: 'demo-kai',
    source: 'claude',
    cwd: '/home/you/code/api-server',
    steps: [
      { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: 'app/Http/Controllers/AuthController.php' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'php artisan test' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'routes/api.php' } },
    ],
  },
  {
    id: 'demo-bo',
    source: 'claude',
    cwd: '/home/you/code/mobile-app',
    steps: [
      { hook_event_name: 'Notification', message: 'Cần bạn duyệt: npm install axios' },
      { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: 'src/api/client.ts' } },
    ],
  },
  {
    id: 'demo-mina',
    source: 'codex',
    cwd: '/home/you/code/web-shop',
    steps: [
      { hook_event_name: 'PreToolUse', tool_name: 'mcp__filesystem__read_file' },
      { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: ['bash', '-lc', 'rg checkout'] } },
      { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { input: '*** Begin Patch\n*** Update File: resources/views/cart.blade.php\n*** End Patch' } },
      { hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'composer require stripe/stripe-php' } },
    ],
  },
  {
    id: 'demo-lu',
    source: 'codex',
    cwd: '/home/you/code/docs-site',
    steps: [{ hook_event_name: 'Stop' }, { hook_event_name: 'UserPromptSubmit' }],
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sends fake hook events to a running server, cycling through each session's steps. */
export async function runDemo(rounds = 20, intervalMs = 2500) {
  const token = getOrCreateToken();
  const post = (source: Source, body: ClaudeHookPayload) =>
    fetch(`http://${HOST}:${PORT}/hook/${source}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

  for (const s of SESSIONS) await post(s.source, { hook_event_name: 'SessionStart', session_id: s.id, cwd: s.cwd });
  console.log(`Demo: ${SESSIONS.length} agent giả, đổi trạng thái mỗi ${intervalMs / 1000}s. Ctrl+C để dừng.`);

  for (let round = 0; round < rounds; round++) {
    for (const s of SESSIONS) {
      const step = s.steps[round % s.steps.length]!;
      await post(s.source, { ...step, session_id: s.id, cwd: s.cwd });
    }
    await sleep(intervalMs);
  }
  for (const s of SESSIONS) await post(s.source, { hook_event_name: 'SessionEnd', session_id: s.id });
}
