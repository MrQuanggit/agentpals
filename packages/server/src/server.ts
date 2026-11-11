import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { relative } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono, type Context, type Next } from 'hono';
import { WebSocketServer, type WebSocket } from 'ws';
import { applyEvent, type AgentEvent, type AgentMap, type ServerMessage } from '@agentpals/core';
import { mapClaudeHook } from './providers/claude/mapHook.ts';
import { mapCodexHook } from './providers/codex/mapHook.ts';
import type { HookPayloadBase } from './providers/shared.ts';

const MAPPERS: Record<string, (p: HookPayloadBase) => AgentEvent | null> = {
  claude: mapClaudeHook,
  codex: mapCodexHook,
};

/** Idle agents with no events for this long are removed (Codex has no SessionEnd hook). */
const IDLE_TTL_MS = 30 * 60 * 1000;

export interface ServerOptions {
  host: string;
  port: number;
  token: string;
  /** Absolute path to the built UI (packages/ui/dist). Served at `/` when given. */
  uiDir?: string;
  log?: boolean;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function createAgentPalsServer({ host, port, token, uiDir, log = true }: ServerOptions) {
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

  // API, hooks and the WebSocket need the token (header for hooks, ?token= for the browser).
  // The static UI itself holds no data, so it is served without one.
  const requireToken = async (c: Context, next: Next) => {
    const header = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const supplied = header ?? c.req.query('token') ?? '';
    if (!safeEqual(supplied, token)) return c.json({ error: 'unauthorized' }, 401);
    await next();
  };
  app.use('/api/*', requireToken);
  app.use('/hook/*', requireToken);

  app.get('/api/health', (c) => c.json({ ok: true }));
  app.get('/api/agents', (c) => c.json(Object.values(agents)));

  app.post('/hook/:source', async (c) => {
    const source = c.req.param('source');
    const map = MAPPERS[source];
    if (!map) return c.json({ error: `unknown source: ${source}` }, 404);
    const payload = (await c.req.json().catch(() => null)) as HookPayloadBase | null;
    const ev = payload ? map(payload) : null;
    if (ev) ingest(ev);
    else if (log && payload) {
      // Helps tune the mappers to new agent versions: run once, copy this line into an issue.
      console.log(`[${source}] bỏ qua payload: event=${payload.hook_event_name ?? '?'} tool=${payload.tool_name ?? '-'} keys=${Object.keys(payload).join(',')}`);
    }
    return c.json({ ok: true, mapped: Boolean(ev) });
  });

  const pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const a of Object.values(agents)) {
      if (a.status === 'idle' && now - a.updatedAt > IDLE_TTL_MS) {
        ingest({ agentId: a.agentId, source: a.source, sessionId: a.sessionId, kind: 'session-end', ts: now });
      }
    }
  }, 60_000);
  pruneTimer.unref();

  if (uiDir) {
    // serveStatic resolves `root` against the working directory.
    app.use('/*', serveStatic({ root: relative(process.cwd(), uiDir) || '.' }));
  }

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
      clearInterval(pruneTimer);
      wss.close();
      server.close();
    },
  };
}
