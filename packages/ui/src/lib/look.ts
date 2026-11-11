import type { AgentSource, AgentState, AgentStatus } from '@agentpals/core';

/** How a character looks. Later this comes from ~/.agentpals/config.yaml. */
export type HairStyle = 'short' | 'long' | 'bun' | 'curly';
export type Accessory = 'none' | 'headphones' | 'glasses';

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
