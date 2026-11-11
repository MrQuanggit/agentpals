import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { WebSocketServer, type WebSocket } from 'ws';
import { applyEvent, type AgentEvent, type AgentMap, type ServerMessage } from '@agentpals/core';
import { mapClaudeHook, type ClaudeHookPayload } from './providers/claude/mapHook.ts';

export interface ServerOptions {
  host: string;
  port: number;
  token: string;
  log?: boolean;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function createAgentPalsServer({ host, port, token, log = true }: ServerOptions) {
  let agents: AgentMap = {};
  const clients = new Set<WebSocket>();

  const send = (ws: WebSocket, msg: ServerMessage) => ws.send(JSON.stringify(msg));
  const broadcast = (msg: ServerMessage) => clients.forEach((ws) => send(ws, msg));

  function ingest(ev: AgentEvent) {
    agents = applyEvent(agents, ev);
    broadcast({ type: 'event', event: ev, agent: agents[ev.agentId] ?? null });
    if (log) console.log(`[${ev.source}] ${ev.sessionId.slice(0, 8)} ${ev.kind}${ev.status ? ` → ${ev.status}` : ''}${ev.detail ? ` · ${ev.detail}` : ''}`);
  }

  const app = new Hono();

  // Every route needs the token: header for hooks, ?token= for the browser.
  app.use('*', async (c, next) => {
    const header = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const supplied = header ?? c.req.query('token') ?? '';
    if (!safeEqual(supplied, token)) return c.json({ error: 'unauthorized' }, 401);
    await next();
  });

  app.get('/api/health', (c) => c.json({ ok: true }));
  app.get('/api/agents', (c) => c.json(Object.values(agents)));

  app.post('/hook/claude', async (c) => {
    const payload = (await c.req.json().catch(() => null)) as ClaudeHookPayload | null;
    const ev = payload ? mapClaudeHook(payload) : null;
    if (ev) ingest(ev);
    return c.json({ ok: true, mapped: Boolean(ev) });
  });

  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws) => {
    clients.add(ws);
    send(ws, { type: 'snapshot', agents: Object.values(agents) });
    ws.on('close', () => clients.delete(ws));
  });

  const server = serve({ fetch: app.fetch, hostname: host, port });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${host}`);
    if (url.pathname !== '/ws' || !safeEqual(url.searchParams.get('token') ?? '', token)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  return {
    app,
    ingest,
    getAgents: () => agents,
    close: () => {
      wss.close();
      server.close();
    },
  };
}
