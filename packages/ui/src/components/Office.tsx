import type { ReactNode } from 'react';
import type { AgentState } from '@agentpals/core';
import { useCharacters } from '@/lib/characters';
import { SOURCE_LABEL, STATUS, displayName, resolveLook, truncate } from '@/lib/look';
import { Desk, DeskDefs } from './office/Desk';
import { VIEWBOX, iso } from './office/geometry';
import { SeatedPerson, StandingPerson } from './office/People';
import { CafeTable, Plant, Room, Sofa } from './office/Room';

/** Desks in floor coordinates (p, q); each agent owns the desk at its index. */
const DESKS = [
  { p: 115, q: 115, tail: 0 },
  { p: 115, q: 360, tail: 39 },
  { p: 360, q: 115, tail: 0 },
  { p: 360, q: 360, tail: 29 },
] as const;

/** Where idle agents hang out in the pantry; `flip` mirrors the figure to face left. */
const PANTRY_SPOTS = [
  { p: 530, q: 82, flip: false }, // at the coffee machine
  { p: 580, q: 382, flip: false }, // left of the café table
  { p: 642, q: 320, flip: true }, // right of the café table
  { p: 622, q: 112, flip: true }, // by the fridge
] as const;

const TABLE = { p: 610, q: 352 };

export const SEAT_COUNT = DESKS.length;
export const PANTRY_COUNT = 4;


/** Agents that are visible somewhere in the office (at a desk, or idle in the pantry). */
export function placedCount(agents: AgentState[]): number {
  const idle = agents.filter((a) => STATUS[a.status].pose === 'idle');
  const working = agents.slice(0, SEAT_COUNT).filter((a) => STATUS[a.status].pose !== 'idle');
  return working.length + Math.min(idle.length, PANTRY_COUNT);
}

interface Drawable {
  depth: number;
  node: ReactNode;
}

interface BubbleSpec {
  agent: AgentState;
  /** Point the tail should touch (just above the head). */
  ax: number;
  ay: number;
  /** Horizontal offset of the bubble centre from the anchor. */
  dx: number;
  compact: boolean;
}

const BUBBLE_H = 46;
const bubbleWidth = (compact: boolean) => (compact ? 190 : 230);

/** Push overlapping bubbles upwards so every label stays readable; returns the final bottom y of each. */
function layoutBubbles(specs: BubbleSpec[]): number[] {
  const order = specs.map((_, i) => i).sort((a, b) => specs[b]!.ay - specs[a]!.ay);
  const placed: Array<{ x0: number; x1: number; y0: number; y1: number }> = [];
  const bottoms: number[] = [];
  for (const i of order) {
    const b = specs[i]!;
    const w = bubbleWidth(b.compact);
    const x0 = b.ax + b.dx - w / 2 - 6;
    const x1 = b.ax + b.dx + w / 2 + 6;
    let bottom = b.ay - 10;
    for (let moved = true; moved; ) {
      moved = false;
      for (const r of placed) {
        if (x0 < r.x1 && x1 > r.x0 && bottom - BUBBLE_H - 6 < r.y1 && bottom > r.y0) {
          bottom = r.y0 - 4;
          moved = true;
        }
      }
    }
    placed.push({ x0, x1, y0: bottom - BUBBLE_H - 6, y1: bottom });
    bottoms[i] = bottom;
  }
  return bottoms;
}

export function Office({ agents }: { agents: AgentState[] }) {
  const chars = useCharacters();
  const drawables: Drawable[] = [];
  const bubbles: BubbleSpec[] = [];
  const tags: ReactNode[] = [];

  // The first SEAT_COUNT agents own a desk (so looks and seats stay stable while they come and go).
  DESKS.forEach((d, i) => {
    const [x, y] = iso(d.p, d.q);
    const agent = agents[i];
    const look = resolveLook(agent, i, chars);
    const meta = agent ? STATUS[agent.status] : null;
    const atDesk = Boolean(agent && meta && meta.pose !== 'idle');
    drawables.push({
      depth: y,
      node: (
        <Desk key={`desk${i}`} x={x} y={y} pose={atDesk ? meta!.pose : null} accent={meta?.screen ?? '#3F4757'}>
          {atDesk && <SeatedPerson look={look} pose={meta!.pose} />}
        </Desk>
      ),
    });
    // head is at (86,-48) in desk space, scaled by 0.8
    if (agent && atDesk) bubbles.push({ agent, ax: x + 69, ay: y - 48, dx: -d.tail, compact: false });
  });

  // Every idle agent (with or without a desk) takes a break in the pantry.
  agents
    .map((agent, i) => ({ agent, i }))
    .filter(({ agent }) => STATUS[agent.status].pose === 'idle')
    .slice(0, PANTRY_SPOTS.length)
    .forEach(({ agent, i }, k) => {
      const spot = PANTRY_SPOTS[k]!;
      const [sx, sy] = iso(spot.p, spot.q);
      drawables.push({
        depth: sy,
        node: (
          <g key={`stand${agent.agentId}`} transform={`translate(${sx},${sy})`}>
            <g className="enter">
              <g transform={`scale(${spot.flip ? -0.85 : 0.85},0.85)`}>
                <StandingPerson look={resolveLook(agent, i, chars)} />
              </g>
            </g>
          </g>
        ),
      });
      tags.push(<NameTag key={`tag${agent.agentId}`} agent={agent} x={sx} y={sy + 14} />);
    });

  drawables.push({ depth: iso(TABLE.p, TABLE.q)[1], node: <CafeTable key="table" {...TABLE} /> });
  drawables.push({ depth: iso(700, 520)[1] - 40, node: <Sofa key="sofa" /> });
  drawables.push({ depth: iso(30, 490)[1], node: <Plant key="plant1" p={30} q={490} /> });
  drawables.push({ depth: iso(430, 20)[1], node: <Plant key="plant2" p={430} q={20} scale={0.8} /> });
  drawables.sort((a, b) => a.depth - b.depth);
  const bottoms = layoutBubbles(bubbles);

  return (
    <svg viewBox={VIEWBOX} role="img" aria-label={`Văn phòng với ${placedCount(agents)} agent`} className="office">
      <defs>
        <DeskDefs />
      </defs>
      <Room />
      {drawables.map((d) => d.node)}
      {tags}
      {bubbles.map((b, i) => (
        <Bubble key={b.agent.agentId} {...b} by={bottoms[i]!} />
      ))}
    </svg>
  );
}

function Bubble({ agent, ax, ay, dx, compact, by }: BubbleSpec & { by: number }) {
  const chars = useCharacters();
  const meta = STATUS[agent.status];
  const waiting = meta.pose === 'waiting';
  const w = bubbleWidth(compact);
  const cx = ax + dx;
  const tail = -dx;
  const lifted = ay - 10 - by; // > 0 when the bubble was pushed up to avoid another one
  const line = truncate(agent.detail && !compact ? agent.detail : meta.label, compact ? 26 : 32);
  const fill = waiting ? '#FFF6E0' : '#FFFFFF';
  return (
    <g transform={`translate(${cx},${by})`}>
      {lifted > 0 && <line x1={tail} y1={0} x2={tail} y2={lifted + 8} stroke={waiting ? '#E3A72F' : '#AEB5C1'} strokeWidth={1.5} strokeDasharray="3 3" />}
      {/* The animated group must not carry the transform attribute: CSS transforms would replace it. */}
      <g className={waiting ? 'pulse' : undefined}>
        <rect x={-w / 2} y={-BUBBLE_H} width={w} height={BUBBLE_H} rx={12} fill={fill} stroke={waiting ? '#E3A72F' : '#D5DAE3'} strokeWidth={1.5} />
        <polygon points={`${tail - 8},-1 ${tail + 8},-1 ${tail},10`} fill={fill} />
        <circle cx={-w / 2 + 19} cy={-23} r={6} fill={meta.screen} />
        <text x={-w / 2 + 33} y={-27} fontSize={13} fontWeight={700} fill="#1C2230">
          {truncate(`${displayName(agent, chars)} · ${SOURCE_LABEL[agent.source]}`, compact ? 22 : 28)}
        </text>
        <text x={-w / 2 + 33} y={-10} fontSize={11.5} fill={waiting ? '#6B4300' : '#4B5563'}>
          {line}
        </text>
      </g>
    </g>
  );
}

/** Small label under someone taking a break (no speech bubble, so nobody gets covered). */
function NameTag({ agent, x, y }: { agent: AgentState; x: number; y: number }) {
  const chars = useCharacters();
  const text = truncate(displayName(agent, chars), 18);
  const w = text.length * 7.4 + 26;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-w / 2} y={0} width={w} height={23} rx={11.5} fill="#FFFFFF" stroke="#D5DAE3" />
      <circle cx={-w / 2 + 12} cy={11.5} r={4} fill={agent.source === 'codex' ? '#1C2230' : '#D97757'} />
      <text x={-w / 2 + 21} y={16} fontSize={12.5} fontWeight={600} fill="#374151">
        {text}
      </text>
    </g>
  );
}
