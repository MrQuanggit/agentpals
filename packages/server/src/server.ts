import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { relative } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono, type Context, type Next } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { WebSocket, WebSocketServer } from 'ws';
import { applyEvent, type AgentEvent, type AgentMap, type ServerMessage } from '@agentpals/core';
import { TOKEN_RE } from './config.ts';
import { mapClaudeHook } from './providers/claude/mapHook.ts';
import { mapCodexHook } from './providers/codex/mapHook.ts';
import { normalizePayload, safeText, stripControl, type HookPayloadBase } from './providers/shared.ts';

const MAPPERS: Record<string, (p: HookPayloadBase) => AgentEvent | null> = {
  claude: mapClaudeHook,
  codex: mapCodexHook,
};

/** Idle agents with no events for this long are removed (Codex has no SessionEnd hook). */
const IDLE_TTL_MS = 30 * 60 * 1000;
/** Upper bound on tracked agents, so a runaway client cannot grow memory without limit. */
const MAX_AGENTS = 100;
/** Hook bodies are trimmed by the hook script; anything bigger is refused. */
const MAX_HOOK_BODY = 64 * 1024;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** Strict CSP for the UI: own scripts only, Google Fonts for type, WebSocket back to loopback. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self' ws://127.0.0.1:* ws://localhost:*",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

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

/** Host header must name a loopback address (blocks DNS-rebinding attacks from web pages). */
export function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return false;
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0]!;
  return LOOPBACK_HOSTS.has(name.toLowerCase());
}

/** Browsers always send Origin on WebSocket upgrades; only pages served from loopback may connect. */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (origin === undefined) return true; // non-browser clients
  try {
    const u = new URL(origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && isLoopbackHost(u.host);
  } catch {
    return false;
  }
}

/** Everything that reaches the UI or the terminal goes through here. */
function sanitizeEvent(ev: AgentEvent): AgentEvent {
  return {
    ...ev,
    sessionId: stripControl(ev.sessionId).slice(0, 200),
    agentId: stripControl(ev.agentId).slice(0, 220),
    detail: ev.detail === undefined ? undefined : safeText(ev.detail, 80),
    cwd: ev.cwd === undefined ? undefined : stripControl(ev.cwd).slice(0, 1024),
  };
}

export function createAgentPalsServer({ host, port, token, uiDir, log = true }: ServerOptions) {
  if (!TOKEN_RE.test(token)) throw new Error('AgentPals: refusing to start with an invalid token');

  let agents: AgentMap = {};
  const clients = new Set<WebSocket>();

  const send = (ws: WebSocket, msg: ServerMessage) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };
  const broadcast = (msg: ServerMessage) => clients.forEach((ws) => send(ws, msg));

  function ingest(raw: AgentEvent) {
    const ev = sanitizeEvent(raw);
    if (!agents[ev.agentId] && ev.kind !== 'session-end' && Object.keys(agents).length >= MAX_AGENTS) {
      if (log) console.warn(`[agentpals] bỏ qua agent mới: đã đủ ${MAX_AGENTS} agent`);
      return;
    }
    agents = applyEvent(agents, ev);
    broadcast({ type: 'event', event: ev, agent: agents[ev.agentId] ?? null });
    if (log) console.log(`[${ev.source}] ${ev.sessionId.slice(0, 8)} ${ev.kind}${ev.status ? ` → ${ev.status}` : ''}${ev.detail ? ` · ${ev.detail}` : ''}`);
  }

  const app = new Hono();

  app.use('*', async (c, next) => {
    // @hono/node-server builds the request URL from the Host header.
    if (!isLoopbackHost(c.req.header('host') ?? new URL(c.req.url).host)) return c.text('forbidden host', 403);
    await next();
    c.header('Content-Security-Policy', CSP);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Frame-Options', 'DENY');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    c.header('Cross-Origin-Resource-Policy', 'same-origin');
  });

  // API, hooks and the WebSocket need the token (header for hooks, ?token= for the browser).
  // The static UI itself holds no data, so it is served without one.
  const requireToken = async (c: Context, next: Next) => {
    const header = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const supplied = header ?? c.req.query('token') ?? '';
    if (!safeEqual(supplied, token)) return c.json({ error: 'unauthorized' }, 401);
    await next();
    c.header('Cache-Control', 'no-store');
  };
  app.use('/api/*', requireToken);
  app.use('/hook/*', requireToken);

  app.get('/api/health', (c) => c.json({ ok: true }));
  app.get('/api/agents', (c) => c.json(Object.values(agents)));

  app.post('/hook/:source', bodyLimit({ maxSize: MAX_HOOK_BODY, onError: (c) => c.json({ error: 'payload too large' }, 413) }), async (c) => {
    const source = c.req.param('source');
    const map = MAPPERS[source];
    if (!map) return c.json({ error: 'unknown source' }, 404);
    const payload = normalizePayload(await c.req.json().catch(() => null));
    const ev = payload ? map(payload) : null;
    if (ev) ingest(ev);
    else if (log && payload) {
      // Helps tune the mappers to new agent versions: run once, copy this line into an issue.
      console.log(`[${source}] bỏ qua payload: event=${safeText(payload.hook_event_name ?? '?', 40)} tool=${safeText(payload.tool_name ?? '-', 60)}`);
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
    app.get('/*', serveStatic({ root: relative(process.cwd(), uiDir) || '.' }));
  }

  // We never read client messages, so keep the accepted frame size tiny.
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  wss.on('connection', (ws) => {
    clients.add(ws);
    send(ws, { type: 'snapshot', agents: Object.values(agents) });
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });

  const server = serve({ fetch: app.fetch, hostname: host, port });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${host}`);
    const ok =
      url.pathname === '/ws' &&
      isLoopbackHost(req.headers.host) &&
      isAllowedOrigin(req.headers.origin) &&
      safeEqual(url.searchParams.get('token') ?? '', token);
    if (!ok) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  return {
    app,
    server,
    ingest,
    getAgents: () => agents,
    close: () => {
      clearInterval(pruneTimer);
      wss.close();
      server.close();
    },
  };
}
