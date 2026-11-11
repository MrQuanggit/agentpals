import { describe, expect, it } from 'vitest';
import { mapCodexHook, patchedFiles } from './mapHook.ts';

const s = { session_id: 'sess_1', cwd: '/home/me/web-shop' };

describe('mapCodexHook', () => {
  it('maps apply_patch to typing with the patched file names', () => {
    const patch = '*** Begin Patch\n*** Update File: src/cart.ts\n@@\n-a\n+b\n*** Add File: src/new.ts\n*** End Patch';
    const ev = mapCodexHook({ ...s, hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { input: patch } });
    expect(ev).toMatchObject({ agentId: 'codex:sess_1', source: 'codex', status: 'typing', detail: 'Sửa cart.ts +1' });
  });

  it('maps Bash to running and unwraps bash -lc', () => {
    const ev = mapCodexHook({ ...s, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: ['bash', '-lc', 'npm test'] } });
    expect(ev).toMatchObject({ status: 'running', detail: '$ npm test' });
  });

  it('treats read-like MCP tools as reading', () => {
    const ev = mapCodexHook({ ...s, hook_event_name: 'PreToolUse', tool_name: 'mcp__filesystem__read_file' });
    expect(ev).toMatchObject({ status: 'reading', detail: 'filesystem · read_file' });
  });

  it('maps PermissionRequest to waiting and Stop to idle', () => {
    expect(mapCodexHook({ ...s, hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: { command: 'npm install' } })).toMatchObject({
      status: 'waiting',
      detail: 'Cần bạn duyệt: npm install',
    });
    expect(mapCodexHook({ ...s, hook_event_name: 'Stop' })?.status).toBe('idle');
  });

  it('returns null for unknown events', () => {
    expect(mapCodexHook({ ...s, hook_event_name: 'PostCompact' })).toBeNull();
  });
});

describe('patchedFiles', () => {
  it('reads file headers from any string field', () => {
    expect(patchedFiles({ patch: '*** Delete File: old/a.php' })).toEqual(['a.php']);
    expect(patchedFiles({})).toEqual([]);
  });
});
