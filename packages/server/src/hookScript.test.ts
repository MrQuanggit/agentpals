import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without types
import { minimize } from '../../../hooks/claude-hook.mjs';

describe('hooks/claude-hook.mjs minimize', () => {
  it('never forwards file contents', () => {
    const out = minimize({
      hook_event_name: 'PreToolUse',
      session_id: 's',
      tool_name: 'Write',
      tool_input: { file_path: '/p/.env', content: 'DB_PASSWORD=hunter2', old_string: 'a', new_string: 'b' },
      transcript_path: '/home/me/.claude/x.jsonl',
    });
    expect(out).toEqual({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Write', tool_input: { file_path: '/p/.env' } });
  });

  it('reduces apply_patch input to file header lines', () => {
    const patch = '*** Begin Patch\n*** Update File: src/a.ts\n@@\n-const key = "old"\n+const key = "new"\n*** End Patch';
    expect(minimize({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'apply_patch', tool_input: { input: patch } }).tool_input).toEqual({
      input: '*** Update File: src/a.ts',
    });
  });

  it('reduces a Codex apply_patch (patch in tool_input.command) to file header lines', () => {
    const patch = '*** Begin Patch\n*** Update File: .env\n@@\n-DB_PASSWORD=old\n+DB_PASSWORD=hunter2\n*** End Patch';
    const out = minimize({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'apply_patch', tool_input: { command: patch } });
    expect(out.tool_input).toEqual({ command: '*** Update File: .env' });
    expect(JSON.stringify(minimize({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Bash', tool_input: { command: `apply_patch <<EOF\n${patch}\nEOF` } }))).not.toContain('hunter2');
  });

  it('caps long strings and ignores non-objects', () => {
    const out = minimize({ hook_event_name: 'PreToolUse', session_id: 's', tool_input: { command: 'x'.repeat(5000) } });
    expect(out.tool_input.command.length).toBe(500);
    expect(minimize('nope')).toBeNull();
    expect(minimize([1])).toBeNull();
  });
});
