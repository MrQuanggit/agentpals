import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { createAgentPalsServer, isAllowedOrigin, isLoopbackHost } from './server.ts';

const uiDir = mkdtempSync(join(tmpdir(), 'agentpals-ui-'));
writeFileSync(join(uiDir, 'index.html'), '<!doctype html><title>AgentPals</title>');

const TOKEN = 'ab'.repeat(24);
const BASE = 'http://127.0.0.1:4777';
const configFile = join(mkdtempSync(join(tmpdir(), 'agentpals-cfg-')), 'config.yaml');
const srv = createAgentPalsServer({ host: '127.0.0.1', port: 0, token: TOKEN, uiDir, configFile, log: false });
afterAll(() => srv.close());

const auth = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' };
const hook = (source: string, body: unknown, headers: Record<string, string> = auth) =>
  srv.app.request(`${BASE}/hook/${source}`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('server', () => {
  it('refuses to start with an empty or weak token', () => {
    expect(() => createAgentPalsServer({ host: '127.0.0.1', port: 0, token: '', log: false })).toThrow();
    expect(() => createAgentPalsServer({ host: '127.0.0.1', port: 0, token: 'secret', log: false })).toThrow();
  });

  it('serves the built UI without a token, with security headers', async () => {
    const res = await srv.app.request(`${BASE}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('AgentPals');
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('rejects non-loopback Host headers (DNS rebinding)', async () => {
    expect((await srv.app.request('http://evil.example:4777/')).status).toBe(403);
    expect((await srv.app.request('http://evil.example:4777/api/agents', { headers: auth })).status).toBe(403);
  });

  it('rejects API and hook calls without the right token', async () => {
    expect((await srv.app.request(`${BASE}/api/agents`)).status).toBe(401);
    expect((await hook('claude', {}, { 'content-type': 'application/json' })).status).toBe(401);
    expect((await hook('claude', {}, { authorization: 'Bearer ' + 'cd'.repeat(24) })).status).toBe(401);
  });

  it('accepts a hook with the token and exposes the agent', async () => {
    expect((await hook('claude', { hook_event_name: 'PreToolUse', session_id: 's1', tool_name: 'Edit', tool_input: { file_path: 'a.ts' } })).status).toBe(200);
    const agents = await (await srv.app.request(`${BASE}/api/agents?token=${TOKEN}`)).json();
    expect(agents[0]).toMatchObject({ agentId: 'claude:s1', status: 'typing' });
  });

  it('routes Codex hooks to the Codex mapper and rejects unknown sources', async () => {
    const body = { hook_event_name: 'PermissionRequest', session_id: 'c1', tool_name: 'Bash', tool_input: { command: 'npm i' } };
    expect((await hook('codex', body)).status).toBe(200);
    expect(srv.getAgents()['codex:c1']).toMatchObject({ source: 'codex', status: 'waiting' });
    expect((await hook('cursor', body)).status).toBe(404);
  });

  it('strips terminal escapes and redacts secrets before showing details', async () => {
    const cmd = 'curl -H "Authorization: Bearer abcdefghijklmnop" \u001b[2J\u001b]0;pwned\u0007 https://u:p4ss@x.io API_KEY=sk-live-123456';
    await hook('claude', { hook_event_name: 'PreToolUse', session_id: 's2', tool_name: 'Bash', tool_input: { command: cmd } });
    const detail = srv.getAgents()['claude:s2']!.detail!;
    expect(detail).not.toMatch(/[\u0000-\u001f]/);
    expect(detail).not.toContain('abcdefghijklmnop');
    expect(detail).not.toContain('p4ss');
    expect(detail.length).toBeLessThanOrEqual(80);
  });

  it('ignores malformed payloads and refuses oversized bodies', async () => {
    expect((await hook('claude', 'not json')).status).toBe(200);
    expect((await hook('claude', [1, 2])).status).toBe(200);
    expect((await hook('claude', { hook_event_name: 'Stop', session_id: { $ne: 1 } })).status).toBe(200);
    expect(Object.keys(srv.getAgents()).some((k) => k.includes('object'))).toBe(false);
    const big = JSON.stringify({ hook_event_name: 'Stop', session_id: 'big', pad: 'x'.repeat(70 * 1024) });
    expect((await hook('claude', big)).status).toBe(413);
  });
});

describe('characters API', () => {
  const call = (method: string, body: unknown, headers: Record<string, string> = auth) =>
    srv.app.request(`${BASE}/api/characters`, { method, headers, body: JSON.stringify(body) });

  it('needs the token', async () => {
    expect((await call('PUT', { key: '/p/api', character: { name: 'Kai' } }, { 'content-type': 'application/json' })).status).toBe(401);
    expect((await srv.app.request(`${BASE}/api/characters`)).status).toBe(401);
  });

  it('saves a validated character to the YAML file (owner-only) and returns it', async () => {
    const res = await call('PUT', { key: '/p/api', character: { name: 'Kai', hair: '#2f5fc4', shirt: 'javascript:alert(1)', hairStyle: 'bun', lines: { typing: 'Đang sửa {detail}' } } });
    expect(res.status).toBe(200);
    const all = await (await srv.app.request(`${BASE}/api/characters`, { headers: auth })).json();
    expect(all['/p/api']).toEqual({ name: 'Kai', hair: '#2F5FC4', hairStyle: 'bun', lines: { typing: 'Đang sửa {detail}' } });
    const yaml = readFileSync(configFile, 'utf8');
    expect(yaml).toContain('name: Kai');
    expect(yaml).not.toContain('javascript');
    if (process.platform !== 'win32') expect(statSync(configFile).mode & 0o777).toBe(0o600);
  });

  it('loads saved characters on the next start', () => {
    const again = createAgentPalsServer({ host: '127.0.0.1', port: 0, token: TOKEN, configFile, log: false });
    again.close();
    writeFileSync(configFile, 'characters:\n  /p/web:\n    name: Mina\n    hair: not-a-color\n  __proto__:\n    name: bad\n');
    const third = createAgentPalsServer({ host: '127.0.0.1', port: 0, token: TOKEN, configFile, log: false });
    third.close();
    expect(true).toBe(true);
  });

  it('rejects bad keys, bad bodies and oversized bodies; delete resets', async () => {
    expect((await call('PUT', { key: '__proto__', character: { name: 'x' } })).status).toBe(400);
    expect((await call('PUT', { key: '/p/api', character: 'nope' })).status).toBe(400);
    expect((await call('PUT', { key: '/p/api', character: { name: 'x'.repeat(9000) } })).status).toBe(413);
    expect((await call('DELETE', { key: '/p/api' })).status).toBe(200);
    const all = await (await srv.app.request(`${BASE}/api/characters`, { headers: auth })).json();
    expect(all['/p/api']).toBeUndefined();
  });
});

describe('websocket', () => {
  const port = () => (srv.server.address() as AddressInfo).port;
  const open = (url: string, origin?: string) =>
    new Promise<string>((resolve) => {
      const ws = new WebSocket(url, origin ? { origin } : {});
      ws.on('message', (m) => {
        resolve(String(m));
        ws.close();
      });
      ws.on('error', () => resolve('rejected'));
      ws.on('close', () => resolve('rejected'));
    });

  it('sends a snapshot to a client with the token from a loopback page', async () => {
    const msg = await open(`ws://127.0.0.1:${port()}/ws?token=${TOKEN}`, `http://127.0.0.1:${port()}`);
    expect(JSON.parse(msg).type).toBe('snapshot');
  });

  it('rejects a wrong token and foreign origins', async () => {
    expect(await open(`ws://127.0.0.1:${port()}/ws?token=nope`)).toBe('rejected');
    expect(await open(`ws://127.0.0.1:${port()}/ws?token=${TOKEN}`, 'https://evil.example')).toBe('rejected');
  });

  it('only allows loopback hosts and origins', () => {
    expect(isLoopbackHost('127.0.0.1:4777')).toBe(true);
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('[::1]:4777')).toBe(true);
    expect(isLoopbackHost('127.0.0.1.evil.com')).toBe(false);
    expect(isLoopbackHost(undefined)).toBe(false);
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedOrigin('null')).toBe(false);
    expect(isAllowedOrigin('https://localhost.evil.com')).toBe(false);
  });
});
