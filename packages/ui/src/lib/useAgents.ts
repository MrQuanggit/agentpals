import { useEffect, useState } from 'react';
import type { AgentState, ServerMessage } from '@agentpals/core';

export type Connection = 'connecting' | 'open' | 'closed' | 'no-token';

const TOKEN_KEY = 'agentpals-token';

/**
 * Take the token from `?token=` once, keep it in sessionStorage (this tab only) and remove it
 * from the address bar, so it does not linger in history, bookmarks or screenshots.
 */
function takeToken(): string | null {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('token');
  if (fromUrl) {
    try {
      sessionStorage.setItem(TOKEN_KEY, fromUrl);
    } catch {
      return fromUrl; // storage blocked: keep it in the URL rather than lose it
    }
    url.searchParams.delete('token');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    return fromUrl;
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Subscribe to the AgentPals server over WebSocket; reconnects every 2s. */
export function useAgents() {
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [conn, setConn] = useState<Connection>('connecting');

  useEffect(() => {
    const token = takeToken();
    if (!token) {
      setConn('no-token');
      return;
    }
    let ws: WebSocket | undefined;
    let timer: number | undefined;
    let stopped = false;

    const connect = () => {
      // Same origin: the server serves the built UI; in dev, Vite proxies /ws to the server.
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`);
      setConn('connecting');
      ws.onopen = () => setConn('open');
      ws.onclose = () => {
        setConn('closed');
        if (!stopped) timer = window.setTimeout(connect, 2000);
      };
      ws.onmessage = (e) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(e.data as string) as ServerMessage;
        } catch {
          return;
        }
        if (msg.type === 'snapshot') {
          setAgents(Object.fromEntries(msg.agents.map((a) => [a.agentId, a])));
          return;
        }
        setAgents((prev) => {
          const next = { ...prev };
          if (msg.agent) next[msg.agent.agentId] = msg.agent;
          else delete next[msg.event.agentId];
          return next;
        });
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      ws?.close();
    };
  }, []);

  const list = Object.values(agents).sort((a, b) => a.startedAt - b.startedAt);
  return { agents: list, conn };
}
