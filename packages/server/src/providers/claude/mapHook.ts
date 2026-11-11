import type { AgentEvent, AgentStatus } from '@agentpals/core';

/** Subset of the JSON Claude Code pipes to a hook command on stdin. */
export interface ClaudeHookPayload {
  hook_event_name?: string;
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  message?: string;
}

const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit']);
const READ_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch']);

function basename(p: unknown): string | undefined {
  if (typeof p !== 'string' || !p) return undefined;
  return p.split(/[\\/]/).pop();
}

function truncate(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function toolStatus(tool: string, input: Record<string, unknown> = {}): { status: AgentStatus; detail: string } {
  if (EDIT_TOOLS.has(tool)) {
    return { status: 'typing', detail: `${tool} ${basename(input.file_path ?? input.notebook_path) ?? ''}`.trim() };
  }
  if (READ_TOOLS.has(tool)) {
    const target = basename(input.file_path) ?? (input.pattern as string) ?? (input.url as string) ?? (input.query as string) ?? '';
    return { status: 'reading', detail: truncate(`${tool} ${target}`.trim()) };
  }
  if (tool === 'Bash') {
    return { status: 'running', detail: truncate(`$ ${String(input.command ?? '')}`) };
  }
  return { status: 'thinking', detail: tool };
}

/** Map one Claude Code hook payload to a normalized AgentEvent (or null to ignore). */
export function mapClaudeHook(p: ClaudeHookPayload, now = Date.now()): AgentEvent | null {
  if (!p.session_id || !p.hook_event_name) return null;
  const base = { agentId: `claude:${p.session_id}`, source: 'claude' as const, sessionId: p.session_id, cwd: p.cwd, ts: now };

  switch (p.hook_event_name) {
    case 'SessionStart':
      return { ...base, kind: 'session-start', status: 'idle' };
    case 'SessionEnd':
      return { ...base, kind: 'session-end' };
    case 'UserPromptSubmit':
      return { ...base, kind: 'status', status: 'thinking', detail: 'Đang suy nghĩ…' };
    case 'PreToolUse':
      return { ...base, kind: 'status', ...toolStatus(p.tool_name ?? 'Tool', p.tool_input) };
    case 'PostToolUse':
      return { ...base, kind: 'status', status: 'thinking' };
    case 'PermissionRequest':
    case 'Notification':
      return { ...base, kind: 'status', status: 'waiting', detail: truncate(p.message ?? `Cần bạn duyệt: ${p.tool_name ?? ''}`.trim()) };
    case 'Stop':
      return { ...base, kind: 'status', status: 'idle', detail: 'Xong lượt' };
    default:
      return null;
  }
}
