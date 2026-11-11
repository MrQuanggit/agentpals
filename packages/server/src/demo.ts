import { HOST, PORT, getOrCreateToken } from './config.ts';
import type { ClaudeHookPayload } from './providers/claude/mapHook.ts';

/** Fake Claude Code sessions, so the office can be tried without running real agents. */
const SESSIONS: Array<{ id: string; cwd: string; steps: ClaudeHookPayload[] }> = [
  {
    id: 'demo-kai',
    cwd: '/home/you/code/api-server',
    steps: [
      { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: 'app/Http/Controllers/AuthController.php' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'php artisan test' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'routes/api.php' } },
    ],
  },
  {
    id: 'demo-bo',
    cwd: '/home/you/code/mobile-app',
    steps: [
      { hook_event_name: 'Notification', message: 'Cần bạn duyệt: npm install axios' },
      { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: 'src/api/client.ts' } },
    ],
  },
  {
    id: 'demo-mina',
    cwd: '/home/you/code/web-shop',
    steps: [
      { hook_event_name: 'PreToolUse', tool_name: 'Grep', tool_input: { pattern: 'checkout' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'routes/web.php' } },
      { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: 'resources/views/cart.blade.php' } },
    ],
  },
  {
    id: 'demo-lu',
    cwd: '/home/you/code/docs-site',
    steps: [{ hook_event_name: 'Stop' }, { hook_event_name: 'UserPromptSubmit' }],
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sends fake hook events to a running server, cycling through each session's steps. */
export async function runDemo(rounds = 20, intervalMs = 2500) {
  const token = getOrCreateToken();
  const post = (body: ClaudeHookPayload) =>
    fetch(`http://${HOST}:${PORT}/hook/claude`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

  for (const s of SESSIONS) await post({ hook_event_name: 'SessionStart', session_id: s.id, cwd: s.cwd });
  console.log(`Demo: ${SESSIONS.length} agent giả, đổi trạng thái mỗi ${intervalMs / 1000}s. Ctrl+C để dừng.`);

  for (let round = 0; round < rounds; round++) {
    for (const s of SESSIONS) {
      const step = s.steps[round % s.steps.length]!;
      await post({ ...step, session_id: s.id, cwd: s.cwd });
    }
    await sleep(intervalMs);
  }
  for (const s of SESSIONS) await post({ hook_event_name: 'SessionEnd', session_id: s.id });
}
