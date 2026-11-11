import { describe, expect, it } from 'vitest';
import { applyEvent, type AgentEvent } from './index.ts';

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
