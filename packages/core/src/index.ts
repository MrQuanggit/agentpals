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
  | { type: 'snapshot'; agents: AgentState[]; characters: CharacterMap }
  | { type: 'event'; event: AgentEvent; agent: AgentState | null }
  | { type: 'characters'; characters: CharacterMap };

// ---------------------------------------------------------------------------
// Characters: how the user customized the avatar of a project's agent.
// ---------------------------------------------------------------------------

export type HairStyle = 'short' | 'long' | 'bun' | 'curly';
export type Accessory = 'none' | 'headphones' | 'glasses';
/** The four visual states a custom speech line can be set for. */
export type LinePose = 'typing' | 'reading' | 'waiting' | 'idle';

export const HAIR_STYLES: readonly HairStyle[] = ['short', 'long', 'bun', 'curly'];
export const ACCESSORIES: readonly Accessory[] = ['none', 'headphones', 'glasses'];
export const LINE_POSES: readonly LinePose[] = ['typing', 'reading', 'waiting', 'idle'];

/** Every field is optional: anything left out falls back to the default look for that seat. */
export interface Character {
  name?: string;
  hair?: string;
  hairStyle?: HairStyle;
  accessory?: Accessory;
  shirt?: string;
  hoodie?: boolean;
  skin?: string;
  pants?: string;
  /** Custom speech lines; `{detail}` is replaced by what the agent is doing. */
  lines?: Partial<Record<LinePose, string>>;
}

/** Characters keyed by project (see characterKey). */
export type CharacterMap = Record<string, Character>;

export const MAX_CHARACTERS = 200;
export const MAX_KEY_LENGTH = 1024;

/** A character belongs to a project folder, so it survives across sessions of the same project. */
export function characterKey(a: Pick<AgentState, 'cwd' | 'agentId'>): string {
  return a.cwd ?? a.agentId;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g;
/** Same set without the g flag, safe for repeated .test() calls. */
const HAS_CONTROL = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
const text = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.replace(CONTROL, ' ').trim().slice(0, max);
  return s || undefined;
};
const color = (v: unknown): string | undefined => (typeof v === 'string' && HEX.test(v) ? v.toUpperCase() : undefined);

/** A usable key: a non-empty string that is not a prototype property name. */
export function isCharacterKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0 && key.length <= MAX_KEY_LENGTH && !HAS_CONTROL.test(key) && !['__proto__', 'constructor', 'prototype'].includes(key);
}

/**
 * Validate untrusted character data (from the API or a hand-edited config file).
 * Unknown fields and invalid values are dropped; returns null when the input is not an object.
 */
export function sanitizeCharacter(raw: unknown): Character | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const out: Character = {};
  const name = text(r.name, 24);
  if (name) out.name = name;
  for (const k of ['hair', 'shirt', 'skin', 'pants'] as const) {
    const c = color(r[k]);
    if (c) out[k] = c;
  }
  if (HAIR_STYLES.includes(r.hairStyle as HairStyle)) out.hairStyle = r.hairStyle as HairStyle;
  if (ACCESSORIES.includes(r.accessory as Accessory)) out.accessory = r.accessory as Accessory;
  if (typeof r.hoodie === 'boolean') out.hoodie = r.hoodie;
  if (r.lines && typeof r.lines === 'object' && !Array.isArray(r.lines)) {
    const lines: Partial<Record<LinePose, string>> = {};
    for (const p of LINE_POSES) {
      const l = text((r.lines as Record<string, unknown>)[p], 60);
      if (l) lines[p] = l;
    }
    if (Object.keys(lines).length) out.lines = lines;
  }
  return out;
}
