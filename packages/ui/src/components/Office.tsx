import type { AgentState } from '@agentpals/core';
import { DEFAULT_LOOKS, SOURCE_LABEL, STATUS, agentName, truncate, type Look, type Pose } from '@/lib/look';

/** Fixed desks in the room (screen coords in the 1200×700 viewBox) and where each speech bubble sits. */
const SEATS = [
  { x: 600, y: 250, bubble: { cx: 669, by: 196, tail: 0 } },
  { x: 370, y: 380, bubble: { cx: 400, by: 326, tail: 39 } },
  { x: 830, y: 380, bubble: { cx: 899, by: 326, tail: 0 } },
  { x: 600, y: 510, bubble: { cx: 640, by: 454, tail: 29 } },
] as const;

export const SEAT_COUNT = SEATS.length;

export function Office({ agents }: { agents: AgentState[] }) {
  const seated = agents.slice(0, SEAT_COUNT);

  return (
    <svg viewBox="0 0 1200 700" role="img" aria-label={`Văn phòng với ${seated.length} agent`} className="office">
      <Defs />
      <Room />
      {SEATS.map((seat, i) => {
        const agent = seated[i];
        return (
          <g key={i} transform={`translate(${seat.x},${seat.y}) scale(0.8)`}>
            <use href="#back" />
            <Screen pose={agent ? STATUS[agent.status].pose : null} color={agent ? STATUS[agent.status].screen : '#3F4757'} />
            <use href="#seat" />
            {agent && <Character look={DEFAULT_LOOKS[i % DEFAULT_LOOKS.length]!} pose={STATUS[agent.status].pose} />}
            <use href="#backrest" />
          </g>
        );
      })}
      <Plant />
      {SEATS.map((seat, i) => {
        const agent = seated[i];
        return agent ? <Bubble key={agent.agentId} agent={agent} {...seat.bubble} /> : null;
      })}
    </svg>
  );
}

function Bubble({ agent, cx, by, tail }: { agent: AgentState; cx: number; by: number; tail: number }) {
  const meta = STATUS[agent.status];
  const waiting = meta.pose === 'waiting';
  const line = truncate(agent.detail ?? meta.label, 32);
  return (
    <g transform={`translate(${cx},${by})`} className={waiting ? 'pulse' : undefined}>
      <rect x={-115} y={-48} width={230} height={48} rx={12} fill={waiting ? '#FFF6E0' : '#FFFFFF'} stroke={waiting ? '#E3A72F' : '#D5DAE3'} strokeWidth={1.5} />
      <polygon points={`${tail - 8},-1 ${tail + 8},-1 ${tail},10`} fill={waiting ? '#FFF6E0' : '#FFFFFF'} />
      <circle cx={-96} cy={-24} r={6} fill={meta.screen} />
      <text x={-82} y={-28} fontSize={13} fontWeight={700} fill="#1C2230">
        {truncate(`${agentName(agent)} · ${SOURCE_LABEL[agent.source]}`, 28)}
      </text>
      <text x={-82} y={-11} fontSize={11.5} fill={waiting ? '#6B4300' : '#4B5563'}>
        {line}
      </text>
    </g>
  );
}

function Screen({ pose, color }: { pose: Pose | null; color: string }) {
  return (
    <>
      <polygon points="-51,-19 16,-52 16,-102 -51,-69" fill={color} />
      {pose === 'typing' && <use href="#lines" className="flicker" />}
      {pose === 'reading' && (
        <>
          <polygon points="-42,-34 6,-58 6,-90 -42,-66" fill="#FFFFFF" opacity={0.9} />
          <line x1={-36} y1={-60} x2={-2} y2={-77} stroke="#1F8A70" strokeWidth={2.5} />
          <line x1={-36} y1={-52} x2={0} y2={-70} stroke="#1F8A70" strokeWidth={2.5} />
          <line x1={-36} y1={-44} x2={-12} y2={-56} stroke="#1F8A70" strokeWidth={2.5} />
        </>
      )}
      {pose === 'waiting' && (
        <text transform="translate(-22,-46) skewY(-26.6)" fontSize={34} fontWeight={700} fill="#FFFFFF">
          !
        </text>
      )}
    </>
  );
}

function Character({ look, pose }: { look: Look; pose: Pose }) {
  const { hair, shirt, skin, pants } = look;
  const headY = pose === 'idle' ? -46 : -42;
  return (
    <g>
      {/* legs */}
      <line x1={100} y1={14} x2={76} y2={2} stroke={pants} strokeWidth={12} strokeLinecap="round" />
      <line x1={76} y1={2} x2={74} y2={44} stroke={pants} strokeWidth={11} strokeLinecap="round" />
      <ellipse cx={70} cy={47} rx={10} ry={5} fill="#2B2F38" />
      <line x1={84} y1={22} x2={60} y2={10} stroke={pants} strokeWidth={12} strokeLinecap="round" />
      <line x1={60} y1={10} x2={58} y2={52} stroke={pants} strokeWidth={11} strokeLinecap="round" />
      <ellipse cx={54} cy={55} rx={10} ry={5} fill="#2B2F38" />

      {/* back arm */}
      {pose === 'typing' && <Arm from={[96, -18]} to={[48, -16]} shirt={shirt} skin={skin} className="bob-b" />}
      {pose === 'reading' && <Arm from={[96, -18]} to={[56, -26]} shirt={shirt} skin={skin} />}
      {pose === 'waiting' && <Arm from={[96, -18]} to={[48, -16]} shirt={shirt} skin={skin} />}

      {/* torso */}
      <path d="M64,-8 Q82,-30 104,-28 L106,10 Q90,26 74,28 Z" fill={shirt} />

      {/* front arm */}
      {pose === 'typing' && <Arm from={[68, -4]} to={[34, -8]} shirt={shirt} skin={skin} className="bob-a" />}
      {pose === 'reading' && <Arm from={[68, -4]} to={[46, -30]} shirt={shirt} skin={skin} />}
      {pose === 'waiting' && <Arm from={[70, -6]} to={[78, -44]} shirt={shirt} skin={skin} className="wave" handR={5} />}
      {pose === 'idle' && (
        <>
          <line x1={68} y1={-6} x2={90} y2={-50} stroke={shirt} strokeWidth={10} strokeLinecap="round" />
          <line x1={100} y1={-22} x2={96} y2={-54} stroke={shirt} strokeWidth={10} strokeLinecap="round" />
        </>
      )}

      {/* head */}
      <circle cx={86} cy={headY} r={14} fill={skin} />
      <ellipse cx={89} cy={headY - 4} rx={15} ry={13.5} fill={hair} />

      {pose === 'idle' && (
        <g className="zz">
          <text x={112} y={-64} fontSize={16} fontWeight={700} fill="#8C94A3">z</text>
          <text x={124} y={-78} fontSize={12} fontWeight={700} fill="#8C94A3">z</text>
        </g>
      )}
    </g>
  );
}

function Arm({ from, to, shirt, skin, className, handR = 4.5 }: { from: [number, number]; to: [number, number]; shirt: string; skin: string; className?: string; handR?: number }) {
  return (
    <g className={className}>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={shirt} strokeWidth={10} strokeLinecap="round" />
      <circle cx={to[0] - 2} cy={to[1]} r={handR} fill={skin} />
    </g>
  );
}

function Defs() {
  const leg = { stroke: '#E0A445', strokeWidth: 7, strokeLinecap: 'round' as const };
  const chairLeg = { stroke: '#B86E1F', strokeWidth: 4, strokeLinecap: 'round' as const };
  const code = { stroke: '#FFFFFF', strokeWidth: 3, strokeLinecap: 'round' as const };
  return (
    <defs>
      <g id="back">
        <ellipse cx={12} cy={38} rx={150} ry={72} fill="#C4CAD6" opacity={0.5} />
        <line x1={-104} y1={-2} x2={-104} y2={64} {...leg} />
        <line x1={104} y1={-14} x2={104} y2={52} {...leg} />
        <polygon points="-100,40 -80,30 -60,40 -80,50" fill="#B4BBC8" />
        <polygon points="-100,40 -80,50 -80,95 -100,85" fill="#5E6577" />
        <polygon points="-80,50 -60,40 -60,85 -80,95" fill="#8D95A6" />
        <line x1={-75} y1={60} x2={-65} y2={55} stroke="#C9CED8" strokeWidth={2} />
        <line x1={-75} y1={66} x2={-65} y2={61} stroke="#C9CED8" strokeWidth={2} />
        <line x1={-10} y1={46} x2={-10} y2={114} {...leg} />
        <polygon points="-110,-10 -10,40 -10,48 -110,-2" fill="#E8B24F" />
        <polygon points="-10,40 110,-20 110,-12 -10,48" fill="#D9A040" />
        <polygon points="-110,-10 10,-70 110,-20 -10,40" fill="#F6CB6E" />
        <line x1={-79} y1={-20} x2={-84} y2={-38} stroke="#E07B39" strokeWidth={3} strokeLinecap="round" />
        <line x1={-75} y1={-20} x2={-74} y2={-40} stroke="#2F9E6B" strokeWidth={3} strokeLinecap="round" />
        <line x1={-71} y1={-20} x2={-66} y2={-36} stroke="#3B6FD8" strokeWidth={3} strokeLinecap="round" />
        <rect x={-82} y={-22} width={14} height={14} fill="#B9D3EE" />
        <ellipse cx={-75} cy={-8} rx={7} ry={3} fill="#B9D3EE" />
        <ellipse cx={-75} cy={-22} rx={7} ry={3} fill="#D6E6F7" />
        <ellipse cx={-15} cy={-26} rx={15} ry={6} fill="#6B7385" />
        <rect x={-19} y={-44} width={8} height={18} fill="#7D8597" />
        <polygon points="20,-50 25,-47 25,-105 20,-108" fill="#3F4757" />
        <polygon points="-55,-13 20,-50 20,-108 -55,-71" fill="#5B6475" />
        <polygon points="45,-40 55,-45 63,-41 53,-36" fill="#2B2F38" />
        <polygon points="0,0 45,-22 57,-16 12,6" fill="#E7EAF0" stroke="#C3C8D2" strokeWidth={1} />
      </g>
      <g id="seat">
        <line x1={60} y1={24} x2={60} y2={60} {...chairLeg} />
        <line x1={124} y1={24} x2={124} y2={60} {...chairLeg} />
        <line x1={92} y1={40} x2={92} y2={78} {...chairLeg} />
        <polygon points="92,8 60,24 92,40 124,24" fill="#E39A3B" />
      </g>
      <g id="backrest">
        <polygon points="92,40 124,24 124,-8 92,8" fill="#C97B26" />
        <line x1={96} y1={28} x2={120} y2={16} stroke="#E39A3B" strokeWidth={3} />
        <line x1={96} y1={16} x2={120} y2={4} stroke="#E39A3B" strokeWidth={3} />
      </g>
      <g id="lines">
        <line x1={-45} y1={-62} x2={-15} y2={-77} {...code} opacity={0.75} />
        <line x1={-45} y1={-54} x2={0} y2={-76} {...code} opacity={0.75} />
        <line x1={-38} y1={-50} x2={-12} y2={-63} {...code} opacity={0.5} />
        <line x1={-45} y1={-38} x2={5} y2={-63} {...code} opacity={0.75} />
      </g>
    </defs>
  );
}

function Room() {
  return (
    <g>
      <polygon points="60,410 600,140 600,10 60,280" fill="#EEF1F6" />
      <polygon points="600,140 1140,410 1140,280 600,10" fill="#DCE2EB" />
      <polygon points="60,410 600,140 1140,410 600,680" fill="#E8E2D6" />
      <polygon points="60,410 600,140 600,148 60,418" fill="#C9CED8" />
      <polygon points="600,140 1140,410 1140,418 600,148" fill="#B9C0CC" />
      <line x1={330} y1={275} x2={870} y2={545} stroke="#DED6C6" strokeWidth={2} />
      <line x1={870} y1={275} x2={330} y2={545} stroke="#DED6C6" strokeWidth={2} />
      {/* sprint board */}
      <polygon points="170,300 340,215 340,140 170,225" fill="#FFFFFF" stroke="#C9CED8" strokeWidth={2} />
      <text transform="translate(186,232) skewY(-26.6)" fontSize={15} fontWeight={700} fill="#1C2230">Sprint</text>
      <polygon points="190,262 220,247 220,232 190,247" fill="#F6CB6E" />
      <polygon points="230,242 260,227 260,212 230,227" fill="#B9D3EE" />
      <polygon points="270,222 300,207 300,192 270,207" fill="#CDEBDF" />
      <polygon points="190,285 220,270 220,255 190,270" fill="#B9D3EE" />
      <polygon points="270,245 300,230 300,215 270,230" fill="#F6CB6E" />
      {/* window */}
      <polygon points="760,95 920,175 920,95 760,15" fill="#5B6475" />
      <polygon points="768,94 912,166 912,100 768,28" fill="#BFD7F2" />
      <line x1={840} y1={64} x2={840} y2={130} stroke="#5B6475" strokeWidth={4} />
      <line x1={768} y1={61} x2={912} y2={133} stroke="#5B6475" strokeWidth={4} />
    </g>
  );
}

function Plant() {
  return (
    <g>
      <ellipse cx={1040} cy={508} rx={34} ry={12} fill="#C4CAD6" opacity={0.5} />
      <ellipse cx={1022} cy={440} rx={12} ry={28} fill="#2F9E6B" transform="rotate(-25 1022 440)" />
      <ellipse cx={1058} cy={440} rx={12} ry={28} fill="#2F9E6B" transform="rotate(25 1058 440)" />
      <ellipse cx={1040} cy={430} rx={11} ry={32} fill="#3BB37A" />
      <polygon points="1018,468 1062,468 1056,506 1024,506" fill="#C97B26" />
      <ellipse cx={1040} cy={468} rx={22} ry={6} fill="#E39A3B" />
    </g>
  );
}
