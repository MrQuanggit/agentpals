import { describe, expect, it } from 'vitest';
import { CLAUDE_EVENTS, stripOurHooks, withOurHooks } from './hooksInstaller.ts';

describe('hooks installer', () => {
  const userHook = { matcher: 'Bash', hooks: [{ type: 'command' as const, command: 'echo mine' }] };

  it('adds our hook for every event and keeps the user hooks', () => {
    const s = withOurHooks({ model: 'opus', hooks: { PreToolUse: [userHook] } }, '/repo/hooks/claude-hook.mjs');
    expect(s.model).toBe('opus');
    for (const e of CLAUDE_EVENTS) expect(JSON.stringify(s.hooks?.[e])).toContain('agentpals');
    expect(s.hooks?.PreToolUse?.[0]).toEqual(userHook);
  });

  it('is idempotent and fully reversible', () => {
    const once = withOurHooks({ hooks: { PreToolUse: [userHook] } }, '/repo/agentpals/hooks/claude-hook.mjs');
    const twice = withOurHooks(once, '/repo/agentpals/hooks/claude-hook.mjs');
    expect(twice).toEqual(once);
    expect(stripOurHooks(twice)).toEqual({ hooks: { PreToolUse: [userHook] } });
  });
});
