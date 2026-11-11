/** Last path segment of a file path (works with / and \). */
export function basename(p: unknown): string | undefined {
  if (typeof p !== 'string' || !p) return undefined;
  return p.split(/[\\/]/).filter(Boolean).pop();
}

export function truncate(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Common fields every hook payload (Claude Code and Codex) carries. */
export interface HookPayloadBase {
  hook_event_name?: string;
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}
