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
  message?: string;
}

// ---------------------------------------------------------------------------
// Untrusted input handling. Hook payloads describe what an agent is doing, and
// agents act on untrusted content (repos, web pages, prompt injection), so every
// string is treated as hostile: typed, length-capped, stripped of terminal
// control characters and scrubbed of obvious secrets before it is shown or logged.
// ---------------------------------------------------------------------------

/** C0/C1 control characters (incl. ESC, which starts ANSI terminal sequences) and bidi overrides. */
const CONTROL = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g;

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  // Specific formats first, so a generic rule cannot hide the label and leave the secret.
  [/\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 ***'],
  // credentials in URLs: scheme://user:pass@host
  [/([a-z][a-z0-9+.-]*:\/\/)[^\s/:@]+:[^\s/@]+@/gi, '$1***@'],
  [/\b(?:sk|pk|rk)[-_](?:live|test|proj|ant)?[-_]?[A-Za-z0-9_-]{6,}/g, '***'],
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/g, '***'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, '***'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '***'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '***'],
  // --password value / --token=value
  [/(--?(?:password|passwd|pass|token|api[-_]?key|secret)[= ])\S+/gi, '$1***'],
  // snake/kebab identifiers followed by a value: `set aws_secret_access_key VALUE`
  [/\b((?=[A-Za-z0-9_-]*[_-])[A-Za-z0-9_-]*(?:secret|passw(?:or)?d|token|api[_-]?key|access[_-]?key)[A-Za-z0-9_-]*)(\s+)(?![-=:])(\S+)/gi, '$1$2***'],
  // NAME=value / NAME: value where NAME looks like a credential
  [/\b([A-Za-z0-9_.-]*(?:key|token|secret|passw(?:or)?d|pwd|auth|credential)[A-Za-z0-9_.-]*)(\s*[=:]\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1$2***'],
];

export function stripControl(s: string): string {
  return s.replace(CONTROL, ' ');
}

export function redactSecrets(s: string): string {
  return SECRET_PATTERNS.reduce((acc, [re, to]) => acc.replace(re, to), s);
}

/** Make an untrusted string safe to display or log. */
export function safeText(s: string, max: number): string {
  return truncate(redactSecrets(stripControl(s)).replace(/\s+/g, ' ').trim(), max);
}

const MAX_FIELD = 4096;

function str(v: unknown, max = MAX_FIELD): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v.slice(0, max) : undefined;
}

/** Validate the shape of a raw hook body; returns null when it is not a usable object. */
export function normalizePayload(raw: unknown): HookPayloadBase | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const session = str(r.session_id, 200);
  const event = str(r.hook_event_name, 64);
  if (!session || !event) return null;
  const input = r.tool_input && typeof r.tool_input === 'object' && !Array.isArray(r.tool_input) ? (r.tool_input as Record<string, unknown>) : undefined;
  return {
    hook_event_name: event,
    session_id: session,
    cwd: str(r.cwd, 1024),
    tool_name: str(r.tool_name, 200),
    tool_input: input,
    message: str(r.message, 1000),
  };
}
