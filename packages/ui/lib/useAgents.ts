'use client';

import { useEffect, useState } from 'react';
import type { AgentState, ServerMessage } from '@agentpals/core';

export type Connection = 'connecting' | 'open' | 'closed' | 'no-token';

const SERVER_PORT = process.env.NEXT_PUBLIC_AGENTPALS_PORT ?? '4777';

/** Subscribe to the AgentPals server over WebSocket; reconnects every 2s. */
export function useAgents() {
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [conn, setConn] = useState<Connection>('connecting');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setConn('no-token');
      return;
    }
    let ws: WebSocket | undefined;
    let timer: number | undefined;
    let stopped = false;

    const connect = () => {
      ws = new WebSocket(`ws://127.0.0.1:${SERVER_PORT}/ws?token=${encodeURIComponent(token)}`);
      setConn('connecting');
      ws.onopen = () => setConn('open');
      ws.onclose = () => {
        setConn('closed');
        if (!stopped) timer = window.setTimeout(connect, 2000);
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as ServerMessage;
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
