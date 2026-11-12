import { characterKey, type Accessory, type AgentSource, type AgentState, type AgentStatus, type Character, type CharacterMap, type HairStyle, type LinePose } from '@agentpals/core';

export type { Accessory, HairStyle };

/** How a character looks. Later this comes from ~/.agentpals/config.yaml. */

export interface Look {
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  /** Hoodie draws a hood behind the neck; otherwise a plain collar. */
  hoodie: boolean;
  skin: string;
  pants: string;
  shoes: string;
  accessory: Accessory;
}

/** Default looks, handed out by seat order (matches the Claude Design mockup). */
export const DEFAULT_LOOKS: Look[] = [
  { hair: '#2F5FC4', hairStyle: 'short', shirt: '#2E3138', hoodie: true, skin: '#F2C9A0', pants: '#7A5230', shoes: '#2B2F38', accessory: 'headphones' },
  { hair: '#3B2A20', hairStyle: 'long', shirt: '#7A4FBF', hoodie: false, skin: '#D9A27A', pants: '#3E4A63', shoes: '#F4F4F2', accessory: 'none' },
  { hair: '#D9692C', hairStyle: 'bun', shirt: '#2F7D6D', hoodie: false, skin: '#F2C9A0', pants: '#3A3F4A', shoes: '#F4F4F2', accessory: 'glasses' },
  { hair: '#8E95A1', hairStyle: 'curly', shirt: '#B5473A', hoodie: true, skin: '#A86F4C', pants: '#5A6B4F', shoes: '#2B2F38', accessory: 'none' },
];

/** Visual group each status animates as. */
export type Pose = 'typing' | 'reading' | 'waiting' | 'idle';

export const STATUS: Record<AgentStatus, { label: string; pose: Pose; screen: string }> = {
  typing: { label: 'Đang gõ', pose: 'typing', screen: '#2F6FD6' },
  running: { label: 'Chạy lệnh', pose: 'typing', screen: '#24324A' },
  thinking: { label: 'Suy nghĩ', pose: 'typing', screen: '#5B86E0' },
  reading: { label: 'Đang đọc', pose: 'reading', screen: '#1F8A70' },
  waiting: { label: 'Chờ bạn', pose: 'waiting', screen: '#E3A72F' },
  idle: { label: 'Nghỉ ở pantry', pose: 'idle', screen: '#8C94A3' },
};

export const SOURCE_LABEL: Record<AgentSource, string> = { claude: 'Claude Code', codex: 'Codex' };

export function agentName(a: AgentState): string {
  return a.cwd?.split(/[\\/]/).filter(Boolean).pop() ?? a.sessionId.slice(0, 8);
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** The user's customization for this agent's project, if any. */
export function characterOf(agent: AgentState | undefined, characters: CharacterMap): Character | undefined {
  return agent ? characters[characterKey(agent)] : undefined;
}

/** Default look for the seat, with the user's choices on top. */
export function resolveLook(agent: AgentState | undefined, index: number, characters: CharacterMap): Look {
  const base = DEFAULT_LOOKS[index % DEFAULT_LOOKS.length]!;
  const c = characterOf(agent, characters);
  if (!c) return base;
  return {
    ...base,
    hair: c.hair ?? base.hair,
    hairStyle: c.hairStyle ?? base.hairStyle,
    shirt: c.shirt ?? base.shirt,
    hoodie: c.hoodie ?? base.hoodie,
    skin: c.skin ?? base.skin,
    pants: c.pants ?? base.pants,
    accessory: c.accessory ?? base.accessory,
  };
}

export function displayName(agent: AgentState, characters: CharacterMap): string {
  return characterOf(agent, characters)?.name ?? agentName(agent);
}

/** What the speech bubble says: the user's line for this state (with {detail} filled in), else the raw detail. */
export function displayLine(agent: AgentState, characters: CharacterMap): string {
  const meta = STATUS[agent.status];
  const template = characterOf(agent, characters)?.lines?.[meta.pose as LinePose];
  if (!template) return agent.detail ?? meta.label;
  return template.replaceAll('{detail}', agent.detail ?? meta.label);
}
