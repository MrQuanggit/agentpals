import type { AgentSource, AgentState, AgentStatus } from '@agentpals/core';

/** How a character looks. Later this comes from ~/.agentpals/config.yaml. */
export interface Look {
  hair: string;
  shirt: string;
  skin: string;
  pants: string;
}

/** Default looks, handed out by seat order (matches the Claude Design mockup). */
export const DEFAULT_LOOKS: Look[] = [
  { hair: '#3B6FD8', shirt: '#2E3138', skin: '#F2C9A0', pants: '#7A5230' },
  { hair: '#4A3426', shirt: '#7A4FBF', skin: '#D9A27A', pants: '#3E4A63' },
  { hair: '#E07B39', shirt: '#2F7D6D', skin: '#F2C9A0', pants: '#3A3F4A' },
  { hair: '#9AA1AD', shirt: '#B5473A', skin: '#F2C9A0', pants: '#5A6B4F' },
];

/** Visual group each status animates as. */
export type Pose = 'typing' | 'reading' | 'waiting' | 'idle';

export const STATUS: Record<AgentStatus, { label: string; pose: Pose; screen: string }> = {
  typing: { label: 'Đang gõ', pose: 'typing', screen: '#2F6FD6' },
  running: { label: 'Chạy lệnh', pose: 'typing', screen: '#24324A' },
  thinking: { label: 'Suy nghĩ', pose: 'typing', screen: '#5B86E0' },
  reading: { label: 'Đang đọc', pose: 'reading', screen: '#1F8A70' },
  waiting: { label: 'Chờ bạn', pose: 'waiting', screen: '#E3A72F' },
  idle: { label: 'Rảnh', pose: 'idle', screen: '#8C94A3' },
};

export const SOURCE_LABEL: Record<AgentSource, string> = { claude: 'Claude Code', codex: 'Codex' };

export function agentName(a: AgentState): string {
  return a.cwd?.split(/[\\/]/).filter(Boolean).pop() ?? a.sessionId.slice(0, 8);
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
