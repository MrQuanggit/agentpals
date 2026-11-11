import type { ReactNode } from 'react';
import type { Pose } from '@/lib/look';

/**
 * One workstation in local coordinates (desk centre ≈ origin), drawn at `translate(x,y) scale(0.8)`.
 * Layers: desk + 2 monitors → screen content → chair seat → person → chair backrest.
 */
export function Desk({ x, y, pose, accent, children }: { x: number; y: number; pose: Pose | null; accent: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x},${y}) scale(0.8)`}>
      <use href="#desk" />
      <Screens pose={pose} accent={accent} />
      <use href="#seat" />
      {children}
      <use href="#backrest" />
    </g>
  );
}

// Inner (glass) area of each monitor, on the plane y = -32 - x/2.
const A = '-68,-1 -24,-23 -24,-68 -68,-46';
const B = '-8,-30 36,-52 36,-98 -8,-76';
const CODE_COLORS = ['#7AA2F7', '#9ECE6A', '#E0AF68', '#BB9AF7', '#7DCFFF', '#9ECE6A'];

/** Lines of "text" running parallel to the monitor plane. */
function TextLines({ x0, y0, lens, color, gap = 7, width = 2.6 }: { x0: number; y0: number; lens: number[]; color: string | string[]; gap?: number; width?: number }) {
  return (
    <>
      {lens.map((len, i) => {
        const indent = i % 3 === 1 ? 5 : 0;
        const x1 = x0 + indent;
        const y1 = y0 + i * gap - indent / 2;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1 + len}
            y2={y1 - len / 2}
            stroke={Array.isArray(color) ? color[i % color.length] : color}
            strokeWidth={width}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

function Screens({ pose, accent }: { pose: Pose | null; accent: string }) {
  if (pose === null || pose === 'idle') {
    // Nobody at the desk: dim screens with a small screensaver dot.
    return (
      <>
        <polygon points={A} fill="#3F4757" />
        <polygon points={B} fill="#3F4757" />
        <circle cx={14} cy={-62} r={3} fill="#8C94A3" className="saver" />
      </>
    );
  }
  return (
    <>
      {/* left monitor: code editor */}
      <polygon points={A} fill="#1E2533" />
      <polygon points="-68,-46 -24,-68 -24,-63 -68,-41" fill="#2B3446" />
      <TextLines x0={-63} y0={-36} lens={[22, 30, 16, 26, 12]} color={CODE_COLORS} />
      {/* right monitor: depends on what the agent is doing */}
      <polygon points={B} fill={accent} />
      {pose === 'typing' && (
        <g className="flicker">
          <TextLines x0={-3} y0={-66} lens={[26, 34, 18, 30, 22]} color="#FFFFFF" />
        </g>
      )}
      {pose === 'reading' && (
        <>
          <polygon points="-2,-37 30,-53 30,-91 -2,-75" fill="#FFFFFF" opacity={0.92} />
          <TextLines x0={3} y0={-69} lens={[20, 24, 14, 22]} color={accent} gap={6} width={2.2} />
        </>
      )}
      {pose === 'waiting' && (
        <text transform="translate(8,-50) skewY(-26.57)" fontSize={30} fontWeight={800} fill="#FFFFFF">
          !
        </text>
      )}
    </>
  );
}

/** Shared desk/chair shapes, referenced with <use>. */
export function DeskDefs() {
  const leg = { stroke: '#E0A445', strokeWidth: 7, strokeLinecap: 'round' as const };
  const chairLeg = { stroke: '#4B5262', strokeWidth: 4, strokeLinecap: 'round' as const };
  return (
    <>
      <g id="desk">
        <ellipse cx={12} cy={38} rx={150} ry={72} fill="#C4CAD6" opacity={0.45} />
        <line x1={-104} y1={-2} x2={-104} y2={64} {...leg} />
        <line x1={104} y1={-14} x2={104} y2={52} {...leg} />
        {/* PC tower */}
        <polygon points="-100,40 -80,30 -60,40 -80,50" fill="#B4BBC8" />
        <polygon points="-100,40 -80,50 -80,95 -100,85" fill="#5E6577" />
        <polygon points="-80,50 -60,40 -60,85 -80,95" fill="#8D95A6" />
        <line x1={-75} y1={60} x2={-65} y2={55} stroke="#C9CED8" strokeWidth={2} />
        <circle cx={-70} cy={74} r={2} fill="#7DCFFF" />
        <line x1={-10} y1={46} x2={-10} y2={114} {...leg} />
        {/* desk top */}
        <polygon points="-110,-10 -10,40 -10,48 -110,-2" fill="#E8B24F" />
        <polygon points="-10,40 110,-20 110,-12 -10,48" fill="#D9A040" />
        <polygon points="-110,-10 10,-70 110,-20 -10,40" fill="#F6CB6E" />
        {/* monitor stands */}
        <ellipse cx={-44} cy={-4} rx={12} ry={5} fill="#5B6475" />
        <rect x={-48} y={-22} width={7} height={18} fill="#6B7385" />
        <ellipse cx={16} cy={-34} rx={12} ry={5} fill="#5B6475" />
        <rect x={12} y={-52} width={7} height={18} fill="#6B7385" />
        {/* monitors */}
        <polygon points="-20,-22 -16,-20 -16,-70 -20,-72" fill="#2B2F38" />
        <polygon points="-72,4 -20,-22 -20,-72 -72,-46" fill="#3A4150" />
        <polygon points="40,-52 44,-50 44,-100 40,-102" fill="#2B2F38" />
        <polygon points="-12,-26 40,-52 40,-102 -12,-76" fill="#3A4150" />
        {/* notebook + pen */}
        <polygon points="-62,16 -42,6 -24,15 -44,25" fill="#F4F6FA" stroke="#D5DAE3" strokeWidth={1} />
        <line x1={-52} y1={11} x2={-34} y2={20} stroke="#E07B39" strokeWidth={1.5} />
        <line x1={-44} y1={20} x2={-32} y2={14} stroke="#2B2F38" strokeWidth={2} strokeLinecap="round" />
        {/* keyboard + mouse */}
        <polygon points="0,0 45,-22 57,-16 12,6" fill="#E7EAF0" stroke="#C3C8D2" strokeWidth={1} />
        <line x1={8} y1={0} x2={46} y2={-19} stroke="#C3C8D2" strokeWidth={1} />
        <line x1={12} y1={3} x2={50} y2={-16} stroke="#C3C8D2" strokeWidth={1} />
        <polygon points="56,-28 72,-36 84,-30 68,-22" fill="#3F4757" />
        <ellipse cx={70} cy={-29} rx={4} ry={2.6} fill="#E7EAF0" />
        {/* coffee mug */}
        <rect x={-90} y={-16} width={10} height={11} rx={2} fill="#FFFFFF" stroke="#C9CFD9" />
        <ellipse cx={-85} cy={-16} rx={5} ry={2} fill="#6E4A2A" />
      </g>
      <g id="seat">
        <line x1={92} y1={30} x2={92} y2={62} stroke="#3F4757" strokeWidth={5} strokeLinecap="round" />
        <line x1={92} y1={62} x2={72} y2={70} {...chairLeg} />
        <line x1={92} y1={62} x2={116} y2={70} {...chairLeg} />
        <line x1={92} y1={62} x2={94} y2={78} {...chairLeg} />
        <circle cx={72} cy={71} r={3} fill="#2B2F38" />
        <circle cx={116} cy={71} r={3} fill="#2B2F38" />
        <circle cx={94} cy={79} r={3} fill="#2B2F38" />
        <polygon points="92,8 60,24 92,40 124,24" fill="#4B5262" />
        <polygon points="92,4 60,20 92,36 124,20" fill="#5E6677" />
      </g>
      <g id="backrest">
        <polygon points="94,36 124,21 124,-14 94,1" fill="#3F4757" />
        <polygon points="97,30 121,18 121,-9 97,3" fill="#4B5262" />
        <line x1={108} y1={26} x2={110} y2={36} stroke="#2B2F38" strokeWidth={4} />
      </g>
    </>
  );
}
