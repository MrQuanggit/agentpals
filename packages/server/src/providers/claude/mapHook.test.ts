import { describe, expect, it } from 'vitest';
import { mapClaudeHook } from './mapHook.ts';

const s = { session_id: 'abc', cwd: '/home/me/api' };

describe('mapClaudeHook', () => {
  it('maps edit tools to typing with the file name', () => {
    const ev = mapClaudeHook({ ...s, hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: '/x/app/AuthController.php' } }, 1);
    expect(ev).toMatchObject({ agentId: 'claude:abc', kind: 'status', status: 'typing', detail: 'Edit AuthController.php' });
  });

  it('maps Bash to running and Read to reading', () => {
    expect(mapClaudeHook({ ...s, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'php artisan test' } })?.status).toBe('running');
    expect(mapClaudeHook({ ...s, hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: 'routes/web.php' } })?.detail).toBe('Read web.php');
  });

  it('maps Notification to waiting and Stop to idle', () => {
    expect(mapClaudeHook({ ...s, hook_event_name: 'Notification', message: 'Claude needs your permission' })?.status).toBe('waiting');
    expect(mapClaudeHook({ ...s, hook_event_name: 'Stop' })?.status).toBe('idle');
  });

  it('ignores payloads without a session', () => {
    expect(mapClaudeHook({ hook_event_name: 'Stop' })).toBeNull();
  });
});
