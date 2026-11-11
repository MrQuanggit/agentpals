import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createAgentPalsServer } from './server.ts';

const uiDir = mkdtempSync(join(tmpdir(), 'agentpals-ui-'));
writeFileSync(join(uiDir, 'index.html'), '<!doctype html><title>AgentPals</title>');

const srv = createAgentPalsServer({ host: '127.0.0.1', port: 0, token: 'secret', uiDir, log: false });
afterAll(() => srv.close());

describe('server', () => {
  it('serves the built UI without a token', async () => {
    const res = await srv.app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('AgentPals');
  });

  it('rejects API and hook calls without the token', async () => {
    expect((await srv.app.request('/api/agents')).status).toBe(401);
    expect((await srv.app.request('/hook/claude', { method: 'POST', body: '{}' })).status).toBe(401);
  });

  it('accepts a hook with the token and exposes the agent', async () => {
    const headers = { authorization: 'Bearer secret', 'content-type': 'application/json' };
    const body = JSON.stringify({ hook_event_name: 'PreToolUse', session_id: 's1', tool_name: 'Edit', tool_input: { file_path: 'a.ts' } });
    expect((await srv.app.request('/hook/claude', { method: 'POST', headers, body })).status).toBe(200);
    const agents = await (await srv.app.request('/api/agents?token=secret')).json();
    expect(agents[0]).toMatchObject({ agentId: 'claude:s1', status: 'typing' });
  });
});
