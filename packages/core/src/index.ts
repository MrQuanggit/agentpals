/** Which coding agent produced an event. */
export type AgentSource = 'claude' | 'codex';

/** What a character is doing right now (drives animation + bubble). */
export type AgentStatus =
  | 'idle' // turn finished, waiting for a new prompt
  | 'thinking' // prompt received, model working, no tool yet
  | 'typing' // editing / writing files
  | 'reading' // reading, searching, fetching
  | 'running' // running a shell command
  | 'waiting'; // needs the human (permission / input)

/** Normalized event every provider emits. */
export interface AgentEvent {
  /** Stable id: `${source}:${sessionId}` */
  agentId: string;
  source: AgentSource;
  sessionId: string;
  kind: 'session-start' | 'session-end' | 'status';
  status?: AgentStatus;
  /** Short human text for the speech bubble, e.g. "Edit AuthController.php". */
  detail?: string;
  /** Working directory of the agent (used to name / map characters). */
  cwd?: string;
  ts: number;
}

export interface AgentState {
  agentId: string;
  source: AgentSource;
  sessionId: string;
  status: AgentStatus;
  detail?: string;
  cwd?: string;
  startedAt: number;
  updatedAt: number;
}

export type AgentMap = Record<string, AgentState>;

/** Pure reducer: apply one event to the agent map. */
export function applyEvent(agents: AgentMap, ev: AgentEvent): AgentMap {
  if (ev.kind === 'session-end') {
    const { [ev.agentId]: _removed, ...rest } = agents;
    return rest;
  }
  const prev = agents[ev.agentId];
  const next: AgentState = {
    agentId: ev.agentId,
    source: ev.source,
    sessionId: ev.sessionId,
    status: ev.status ?? prev?.status ?? 'idle',
    detail: ev.kind === 'session-start' ? undefined : ev.detail,
    cwd: ev.cwd ?? prev?.cwd,
    startedAt: prev?.startedAt ?? ev.ts,
    updatedAt: ev.ts,
  };
  return { ...agents, [ev.agentId]: next };
}

/** Messages the server pushes to the UI over WebSocket. */
export type ServerMessage =
  | { type: 'snapshot'; agents: AgentState[] }
  | { type: 'event'; event: AgentEvent; agent: AgentState | null };
