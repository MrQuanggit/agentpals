import { describe, expect, it } from 'vitest';
import { applyEvent, characterKey, isCharacterKey, sanitizeCharacter, type AgentEvent } from './index.ts';

const base = { agentId: 'claude:s1', source: 'claude', sessionId: 's1' } as const;

describe('applyEvent', () => {
  it('creates an agent on session-start and updates status', () => {
    let m = applyEvent({}, { ...base, kind: 'session-start', status: 'idle', cwd: '/p', ts: 1 });
    m = applyEvent(m, { ...base, kind: 'status', status: 'typing', detail: 'Edit a.ts', ts: 2 });
    expect(m['claude:s1']).toMatchObject({ status: 'typing', detail: 'Edit a.ts', cwd: '/p', startedAt: 1, updatedAt: 2 });
  });

  it('removes the agent on session-end', () => {
    const start: AgentEvent = { ...base, kind: 'session-start', ts: 1 };
    const m = applyEvent(applyEvent({}, start), { ...base, kind: 'session-end', ts: 2 });
    expect(m).toEqual({});
  });
});

describe('characters', () => {
  it('keeps valid fields and drops everything else', () => {
    const c = sanitizeCharacter({
      name: '  Kai\u001b[31m  ',
      hair: '#2f5fc4',
      shirt: 'red; background:url(x)',
      skin: '#12345',
      hairStyle: 'mohawk',
      accessory: 'glasses',
      hoodie: 'yes',
      lines: { typing: 'Đang sửa {detail}', idle: 'x'.repeat(200), hacking: 'nope' },
      __proto__: { admin: true },
      extra: 1,
    });
    expect(c).toEqual({ name: 'Kai [31m', hair: '#2F5FC4', accessory: 'glasses', lines: { typing: 'Đang sửa {detail}', idle: 'x'.repeat(60) } });
  });

  it('rejects non-objects and unsafe keys', () => {
    expect(sanitizeCharacter('x')).toBeNull();
    expect(sanitizeCharacter([])).toBeNull();
    expect(isCharacterKey('/home/me/api')).toBe(true);
    expect(isCharacterKey('__proto__')).toBe(false);
    expect(isCharacterKey('')).toBe(false);
    expect(isCharacterKey('a'.repeat(2000))).toBe(false);
  });

  it('keys a character by project folder', () => {
    expect(characterKey({ cwd: '/p/api', agentId: 'claude:s1' })).toBe('/p/api');
    expect(characterKey({ agentId: 'claude:s1' })).toBe('claude:s1');
  });
});
