import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLAUDE_EVENTS, CODEX_EVENTS, installHooks, stripOurHooks, uninstallHooks, withOurHooks } from './hooksInstaller.ts';

const claude = { events: CLAUDE_EVENTS, toolMatcher: '*', args: '' };
const codex = { events: CODEX_EVENTS, args: '--source codex' };

describe('hooks installer', () => {
  const userHook = { matcher: 'Bash', hooks: [{ type: 'command' as const, command: 'echo mine' }] };

  it('adds our hook for every event and keeps the user hooks', () => {
    const s = withOurHooks({ model: 'opus', hooks: { PreToolUse: [userHook] } }, '/repo/hooks/claude-hook.mjs', claude);
    expect(s.model).toBe('opus');
    for (const e of CLAUDE_EVENTS) expect(JSON.stringify(s.hooks?.[e])).toContain('--agentpals');
    expect(s.hooks?.PreToolUse?.[0]).toEqual(userHook);
    expect(s.hooks?.PreToolUse?.[1]?.matcher).toBe('*');
  });

  it('is idempotent and fully reversible', () => {
    const once = withOurHooks({ hooks: { PreToolUse: [userHook] } }, '/repo/hooks/claude-hook.mjs', claude);
    expect(withOurHooks(once, '/repo/hooks/claude-hook.mjs', claude)).toEqual(once);
    expect(stripOurHooks(once)).toEqual({ hooks: { PreToolUse: [userHook] } });
  });

  it('writes Codex hooks with --source codex and no matcher', () => {
    const s = withOurHooks({}, '/repo/hooks/claude-hook.mjs', codex);
    expect(Object.keys(s.hooks ?? {})).toEqual([...CODEX_EVENTS]);
    const group = s.hooks?.PreToolUse?.[0];
    expect(group?.matcher).toBeUndefined();
    expect(group?.hooks[0]?.command).toBe('node "/repo/hooks/claude-hook.mjs" --agentpals --source codex');
  });

  it('installs only for agents that exist, then uninstalls cleanly', () => {
    const root = mkdtempSync(join(tmpdir(), 'agentpals-hooks-'));
    const codexDir = join(root, '.codex');
    mkdirSync(codexDir);
    writeFileSync(join(codexDir, 'hooks.json'), JSON.stringify({ hooks: { Stop: [userHook] } }));
    process.env.CLAUDE_SETTINGS = join(root, 'missing', 'settings.json');
    process.env.CODEX_HOOKS = join(codexDir, 'hooks.json');
    try {
      const res = installHooks();
      expect(res.map((r) => [r.name, r.done])).toEqual([
        ['Claude Code', false],
        ['Codex', true],
      ]);
      const written = JSON.parse(readFileSync(process.env.CODEX_HOOKS, 'utf8'));
      expect(written.hooks.Stop).toHaveLength(2);
      uninstallHooks();
      expect(JSON.parse(readFileSync(process.env.CODEX_HOOKS, 'utf8'))).toEqual({ hooks: { Stop: [userHook] } });
    } finally {
      delete process.env.CLAUDE_SETTINGS;
      delete process.env.CODEX_HOOKS;
    }
  });
});
