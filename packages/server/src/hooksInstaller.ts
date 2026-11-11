import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Claude Code events AgentPals listens to (~/.claude/settings.json). */
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

/** Codex CLI events AgentPals listens to (~/.codex/hooks.json, Codex ≥ 0.124). */
export const CODEX_EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PermissionRequest', 'PostToolUse', 'Stop'] as const;

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

export interface HookTarget {
  name: 'Claude Code' | 'Codex';
  /** Settings file that holds the `hooks` object. */
  file: string;
  events: readonly string[];
  /** Matcher for tool events; Claude needs "*", Codex matches all when omitted. */
  toolMatcher?: string;
  /** Extra args for the hook script. */
  args: string;
  /** Only install when this directory exists (the agent is installed). */
  requiresDir: string;
}

export function hookTargets(): HookTarget[] {
  const claudeDir = join(homedir(), '.claude');
  const codexDir = process.env.CODEX_HOME ?? join(homedir(), '.codex');
  return [
    {
      name: 'Claude Code',
      file: process.env.CLAUDE_SETTINGS ?? join(claudeDir, 'settings.json'),
      events: CLAUDE_EVENTS,
      toolMatcher: '*',
      args: '',
      requiresDir: process.env.CLAUDE_SETTINGS ? dirname(process.env.CLAUDE_SETTINGS) : claudeDir,
    },
    {
      name: 'Codex',
      file: process.env.CODEX_HOOKS ?? join(codexDir, 'hooks.json'),
      events: CODEX_EVENTS,
      args: '--source codex',
      requiresDir: process.env.CODEX_HOOKS ? dirname(process.env.CODEX_HOOKS) : codexDir,
    },
  ];
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

/** Remove every hook we added before (identified by the marker in the command). */
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

export function withOurHooks(s: Settings, scriptPath: string, target: Pick<HookTarget, 'events' | 'toolMatcher' | 'args'>): Settings {
  const clean = stripOurHooks(s);
  const hooks = { ...(clean.hooks ?? {}) };
  const command = `node "${scriptPath}" ${MARKER}${target.args ? ` ${target.args}` : ''}`;
  for (const event of target.events) {
    const isToolEvent = event === 'PreToolUse' || event === 'PostToolUse';
    const group: HookGroup = isToolEvent && target.toolMatcher ? { matcher: target.toolMatcher, hooks: [] } : { hooks: [] };
    group.hooks.push({ type: 'command', command, timeout: 5 });
    hooks[event] = [...(hooks[event] ?? []), group];
  }
  return { ...clean, hooks };
}

export interface InstallResult {
  name: HookTarget['name'];
  file: string;
  done: boolean;
}

export function installHooks(): InstallResult[] {
  return hookTargets().map((t) => {
    if (!existsSync(t.requiresDir)) return { name: t.name, file: t.file, done: false };
    write(t.file, withOurHooks(read(t.file), hookScriptPath(), t));
    return { name: t.name, file: t.file, done: true };
  });
}

export function uninstallHooks(): InstallResult[] {
  return hookTargets().map((t) => {
    if (!existsSync(t.file)) return { name: t.name, file: t.file, done: false };
    write(t.file, stripOurHooks(read(t.file)));
    return { name: t.name, file: t.file, done: true };
  });
}
