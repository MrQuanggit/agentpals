import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Claude Code events AgentPals listens to. */
export const CLAUDE_EVENTS = [
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PermissionRequest',
  'Notification',
  'Stop',
] as const;

/** Flag appended to our command so we can find (and remove) only our own hooks. */
const MARKER = '--agentpals';

interface HookCommand {
  type: 'command';
  command: string;
  timeout?: number;
}
interface HookGroup {
  matcher?: string;
  hooks: HookCommand[];
}
type Settings = { hooks?: Record<string, HookGroup[]> } & Record<string, unknown>;

export function claudeSettingsPath(): string {
  return process.env.CLAUDE_SETTINGS ?? join(homedir(), '.claude', 'settings.json');
}

/** Absolute path to hooks/claude-hook.mjs at the repo root. */
export function hookScriptPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '../../../hooks/claude-hook.mjs');
}

function read(path: string): Settings {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')) as Settings;
}

function write(path: string, s: Settings) {
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) copyFileSync(path, `${path}.agentpals.bak`);
  writeFileSync(path, `${JSON.stringify(s, null, 2)}\n`);
}

/** Remove every hook group we added before (identified by the marker in the command). */
export function stripOurHooks(s: Settings): Settings {
  if (!s.hooks) return s;
  const hooks: Record<string, HookGroup[]> = {};
  for (const [event, groups] of Object.entries(s.hooks)) {
    const kept = groups
      .map((g) => ({ ...g, hooks: g.hooks.filter((h) => !h.command.includes(MARKER)) }))
      .filter((g) => g.hooks.length > 0);
    if (kept.length) hooks[event] = kept;
  }
  const { hooks: _old, ...rest } = s;
  return Object.keys(hooks).length ? { ...rest, hooks } : rest;
}

export function withOurHooks(s: Settings, scriptPath: string): Settings {
  const clean = stripOurHooks(s);
  const hooks = { ...(clean.hooks ?? {}) };
  const command = `node "${scriptPath}" ${MARKER}`;
  for (const event of CLAUDE_EVENTS) {
    const group: HookGroup = event === 'PreToolUse' || event === 'PostToolUse' ? { matcher: '*', hooks: [] } : { hooks: [] };
    group.hooks.push({ type: 'command', command, timeout: 5 });
    hooks[event] = [...(hooks[event] ?? []), group];
  }
  return { ...clean, hooks };
}

export function installClaudeHooks(): string {
  const path = claudeSettingsPath();
  write(path, withOurHooks(read(path), hookScriptPath()));
  return path;
}

export function uninstallClaudeHooks(): string {
  const path = claudeSettingsPath();
  if (existsSync(path)) write(path, stripOurHooks(read(path)));
  return path;
}
