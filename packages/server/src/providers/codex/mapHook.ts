import type { AgentEvent, AgentStatus } from '@agentpals/core';
import { basename, truncate, type HookPayloadBase } from '../shared.ts';

/**
 * Codex CLI hook payload (stdin JSON). Codex hooks (stable since v0.124) send
 * session_id, cwd, hook_event_name, plus tool_name / tool_input on tool events.
 * Events: SessionStart, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, Stop.
 */
export type CodexHookPayload = HookPayloadBase;

const READ_HINT = /read|view|search|grep|find|list|glob|fetch|web|open/i;

/** File names touched by an apply_patch call: `*** Update File: path` lines anywhere in the input. */
export function patchedFiles(input: Record<string, unknown> = {}): string[] {
  const text = Object.values(input)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === 'string')
    .join('\n');
  const files = [...text.matchAll(/\*\*\* (?:Update|Add|Delete) File: (.+)/g)].map((m) => basename(m[1]!.trim()) ?? '');
  return files.filter(Boolean);
}

function commandText(cmd: unknown): string {
  if (Array.isArray(cmd)) {
    // ["bash", "-lc", "php artisan test"] → the actual script
    const strs = cmd.filter((c): c is string => typeof c === 'string');
    return strs.length >= 3 && /^-\w*c$/.test(strs[1] ?? '') ? strs.slice(2).join(' ') : strs.join(' ');
  }
  return typeof cmd === 'string' ? cmd : '';
}

function toolStatus(tool: string, input: Record<string, unknown> = {}): { status: AgentStatus; detail: string } {
  if (tool === 'apply_patch' || tool === 'Edit' || tool === 'Write') {
    const files = patchedFiles(input);
    const first = files[0] ?? basename(input.file_path) ?? '';
    const more = files.length > 1 ? ` +${files.length - 1}` : '';
    return { status: 'typing', detail: `Sửa ${first}${more}`.trim() };
  }
  if (tool === 'Bash' || tool === 'shell' || tool === 'exec_command') {
    return { status: 'running', detail: truncate(`$ ${commandText(input.command ?? input.cmd)}`) };
  }
  const short = tool.startsWith('mcp__') ? tool.split('__').slice(1).join(' · ') : tool;
  if (READ_HINT.test(tool)) return { status: 'reading', detail: truncate(short) };
  return { status: 'thinking', detail: truncate(short) };
}

/** Map one Codex hook payload to a normalized AgentEvent (or null to ignore). */
export function mapCodexHook(p: CodexHookPayload, now = Date.now()): AgentEvent | null {
  if (!p.session_id || !p.hook_event_name) return null;
  const base = { agentId: `codex:${p.session_id}`, source: 'codex' as const, sessionId: p.session_id, cwd: p.cwd, ts: now };

  switch (p.hook_event_name) {
    case 'SessionStart':
      return { ...base, kind: 'session-start', status: 'idle' };
    case 'UserPromptSubmit':
      return { ...base, kind: 'status', status: 'thinking', detail: 'Đang suy nghĩ…' };
    case 'PreToolUse':
      return { ...base, kind: 'status', ...toolStatus(p.tool_name ?? 'tool', p.tool_input) };
    case 'PostToolUse':
      return { ...base, kind: 'status', status: 'thinking' };
    case 'PermissionRequest': {
      const what = p.tool_name === 'Bash' ? commandText(p.tool_input?.command) : (p.tool_name ?? '');
      return { ...base, kind: 'status', status: 'waiting', detail: truncate(`Cần bạn duyệt: ${what}`.trim()) };
    }
    case 'Stop':
      return { ...base, kind: 'status', status: 'idle', detail: 'Xong lượt' };
    case 'SessionEnd':
      return { ...base, kind: 'session-end' };
    default:
      return null;
  }
}
