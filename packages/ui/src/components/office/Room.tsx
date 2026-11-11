import { PANTRY_P, ROOM, box, iso, leftWallRect, pts, rightWallRect } from './geometry';

const { p: P, q: Q, wall: H } = ROOM;

/** Walls, floor and everything fixed to the walls (drawn first, behind desks and people). */
export function Room() {
  const planks = [];
  for (let p = 35; p < PANTRY_P; p += 35) {
    planks.push(<line key={`pl${p}`} x1={iso(p, 0)[0]} y1={iso(p, 0)[1]} x2={iso(p, Q)[0]} y2={iso(p, Q)[1]} stroke="#DDD5C5" strokeWidth={1.2} />);
  }
  const tiles = [];
  for (let p = PANTRY_P + 42; p < P; p += 42) {
    tiles.push(<line key={`tp${p}`} x1={iso(p, 0)[0]} y1={iso(p, 0)[1]} x2={iso(p, Q)[0]} y2={iso(p, Q)[1]} stroke="#DCD8D0" strokeWidth={1} />);
  }
  for (let q = 42; q < Q; q += 42) {
    tiles.push(<line key={`tq${q}`} x1={iso(PANTRY_P, q)[0]} y1={iso(PANTRY_P, q)[1]} x2={iso(P, q)[0]} y2={iso(P, q)[1]} stroke="#DCD8D0" strokeWidth={1} />);
  }

  return (
    <g>
      {/* walls */}
      <polygon points={pts(iso(0, 0), iso(0, Q), iso(0, Q, H), iso(0, 0, H))} fill="#EEF1F6" />
      <polygon points={pts(iso(0, 0), iso(P, 0), iso(P, 0, H), iso(0, 0, H))} fill="#DCE2EB" />
      <polygon points={pts(iso(0, 0, H), iso(0, Q, H), iso(0, Q, H + 6), iso(0, 0, H + 6))} fill="#D5DAE3" />
      <polygon points={pts(iso(0, 0, H), iso(P, 0, H), iso(P, 0, H + 6), iso(0, 0, H + 6))} fill="#C9CFD9" />

      {/* floor: wood in the work area, tiles in the pantry */}
      <polygon points={pts(iso(0, 0), iso(P, 0), iso(P, Q), iso(0, Q))} fill="#E8E0CF" />
      {planks}
      <polygon points={pts(iso(PANTRY_P, 0), iso(P, 0), iso(P, Q), iso(PANTRY_P, Q))} fill="#F2EFE9" />
      {tiles}
      <line x1={iso(PANTRY_P, 0)[0]} y1={iso(PANTRY_P, 0)[1]} x2={iso(PANTRY_P, Q)[0]} y2={iso(PANTRY_P, Q)[1]} stroke="#C9C1B0" strokeWidth={3} />

      {/* baseboards */}
      <polygon points={pts(iso(0, 0), iso(0, Q), iso(0, Q, 7), iso(0, 0, 7))} fill="#C9CED8" />
      <polygon points={pts(iso(0, 0), iso(P, 0), iso(P, 0, 7), iso(0, 0, 7))} fill="#B9C0CC" />

      {/* left wall: sprint board + clock */}
      <polygon points={leftWallRect(110, 300, 50, 120)} fill="#FFFFFF" stroke="#C9CED8" strokeWidth={2} />
      <text transform={`translate(${iso(0, 122, 104)[0]},${iso(0, 122, 104)[1]}) skewY(-26.57)`} fontSize={14} fontWeight={700} fill="#1C2230">
        Sprint
      </text>
      {[
        [130, 158, 62, 80, '#F6CB6E'],
        [170, 198, 62, 80, '#B9D3EE'],
        [210, 238, 62, 80, '#CDEBDF'],
        [250, 278, 62, 80, '#F6CB6E'],
        [130, 158, 84, 100, '#B9D3EE'],
        [210, 238, 84, 100, '#F6CB6E'],
        [250, 278, 84, 100, '#F4C7C3'],
      ].map(([q0, q1, h0, h1, c], i) => (
        <polygon key={i} points={leftWallRect(q0 as number, q1 as number, h0 as number, h1 as number)} fill={c as string} />
      ))}
      <ellipse cx={iso(0, 400, 95)[0]} cy={iso(0, 400, 95)[1]} rx={15} ry={19} transform={`rotate(-27 ${iso(0, 400, 95)[0]} ${iso(0, 400, 95)[1]})`} fill="#FFFFFF" stroke="#5B6475" strokeWidth={3} />
      <line x1={iso(0, 400, 95)[0]} y1={iso(0, 400, 95)[1]} x2={iso(0, 400, 105)[0]} y2={iso(0, 400, 105)[1]} stroke="#1C2230" strokeWidth={2} strokeLinecap="round" />
      <line x1={iso(0, 400, 95)[0]} y1={iso(0, 400, 95)[1]} x2={iso(0, 393, 95)[0]} y2={iso(0, 393, 95)[1]} stroke="#1C2230" strokeWidth={2} strokeLinecap="round" />

      {/* right wall: window */}
      <polygon points={rightWallRect(150, 390, 40, 125)} fill="#5B6475" />
      <polygon points={rightWallRect(158, 382, 46, 119)} fill="#BFD7F2" />
      <polygon points={rightWallRect(158, 230, 46, 119)} fill="#D3E4F7" />
      <line x1={iso(270, 0, 46)[0]} y1={iso(270, 0, 46)[1]} x2={iso(270, 0, 119)[0]} y2={iso(270, 0, 119)[1]} stroke="#5B6475" strokeWidth={4} />
      <line x1={iso(158, 0, 82)[0]} y1={iso(158, 0, 82)[1]} x2={iso(382, 0, 82)[0]} y2={iso(382, 0, 82)[1]} stroke="#5B6475" strokeWidth={4} />
      <polygon points={rightWallRect(146, 394, 36, 40)} fill="#C9CFD9" />

      <PantryWall />
    </g>
  );
}

/** Pantry pieces standing against the right wall: backsplash, cabinets, counter, coffee machine, fridge. */
function PantryWall() {
  const counter = box(480, 640, 0, 38, 44);
  const fridge = box(648, 696, 0, 44, 122);
  const machine = box(504, 524, 10, 26, 22, 44);
  const kettle = iso(600, 20, 44);
  return (
    <g>
      <text transform={`translate(${iso(486, 0, 128)[0]},${iso(486, 0, 128)[1]}) skewY(26.57)`} fontSize={13} fontWeight={700} fill="#5B6475" letterSpacing={2}>
        PANTRY
      </text>
      <polygon points={rightWallRect(480, 640, 44, 80)} fill="#E9F0F4" />
      {[500, 520, 540, 560, 580, 600, 620].map((p) => (
        <line key={p} x1={iso(p, 0, 44)[0]} y1={iso(p, 0, 44)[1]} x2={iso(p, 0, 80)[0]} y2={iso(p, 0, 80)[1]} stroke="#D3DEE5" strokeWidth={1} />
      ))}
      <polygon points={rightWallRect(480, 640, 86, 120)} fill="#F4F1EA" stroke="#D5CFC2" strokeWidth={1.5} />
      <line x1={iso(560, 0, 86)[0]} y1={iso(560, 0, 86)[1]} x2={iso(560, 0, 120)[0]} y2={iso(560, 0, 120)[1]} stroke="#D5CFC2" strokeWidth={1.5} />
      <line x1={iso(552, 0, 92)[0]} y1={iso(552, 0, 92)[1]} x2={iso(552, 0, 102)[0]} y2={iso(552, 0, 102)[1]} stroke="#9AA1AD" strokeWidth={2} strokeLinecap="round" />
      <line x1={iso(568, 0, 92)[0]} y1={iso(568, 0, 92)[1]} x2={iso(568, 0, 102)[0]} y2={iso(568, 0, 102)[1]} stroke="#9AA1AD" strokeWidth={2} strokeLinecap="round" />

      {/* counter */}
      <polygon points={counter.front} fill="#7A8698" />
      <polygon points={counter.side} fill="#667284" />
      <polygon points={counter.top} fill="#F6F7F9" stroke="#D5DAE3" strokeWidth={1} />
      {[520, 560, 600].map((p) => (
        <line key={p} x1={iso(p, 38, 6)[0]} y1={iso(p, 38, 6)[1]} x2={iso(p, 38, 40)[0]} y2={iso(p, 38, 40)[1]} stroke="#667284" strokeWidth={1.5} />
      ))}
      {/* coffee machine */}
      <polygon points={machine.front} fill="#2B2F38" />
      <polygon points={machine.side} fill="#1C2028" />
      <polygon points={machine.top} fill="#3F4757" />
      <circle cx={iso(514, 26, 58)[0]} cy={iso(514, 26, 58)[1]} r={2} fill="#E3A72F" />
      <rect x={iso(512, 30, 50)[0] - 3.5} y={iso(512, 30, 50)[1]} width={7} height={6} rx={1.5} fill="#FFFFFF" />
      {/* kettle + mugs */}
      <ellipse cx={kettle[0]} cy={kettle[1]} rx={9} ry={4} fill="#C9CFD9" />
      <path d={`M${kettle[0] - 9},${kettle[1]} v-14 q9,-7 18,0 v14 Z`} fill="#E1E5EC" />
      <rect x={iso(560, 18, 44)[0] - 4} y={iso(560, 18, 44)[1] - 9} width={8} height={9} rx={2} fill="#E07B39" />
      <rect x={iso(575, 22, 44)[0] - 4} y={iso(575, 22, 44)[1] - 9} width={8} height={9} rx={2} fill="#3B6FD8" />
      {/* fridge */}
      <polygon points={fridge.front} fill="#E7EAF0" />
      <polygon points={fridge.side} fill="#C9CFD9" />
      <polygon points={fridge.top} fill="#F4F6FA" />
      <line x1={iso(648, 44, 78)[0]} y1={iso(648, 44, 78)[1]} x2={iso(696, 44, 78)[0]} y2={iso(696, 44, 78)[1]} stroke="#B4BBC8" strokeWidth={2} />
      <line x1={iso(656, 44, 90)[0]} y1={iso(656, 44, 90)[1]} x2={iso(656, 44, 110)[0]} y2={iso(656, 44, 110)[1]} stroke="#8D95A6" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={iso(656, 44, 50)[0]} y1={iso(656, 44, 50)[1]} x2={iso(656, 44, 68)[0]} y2={iso(656, 44, 68)[1]} stroke="#8D95A6" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/** Round café table with two stools (sorted with people by depth). */
export function CafeTable({ p, q }: { p: number; q: number }) {
  const [x, y] = iso(p, q);
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={34} ry={14} fill="#C4CAD6" opacity={0.5} />
      <rect x={x - 3} y={y - 44} width={6} height={44} fill="#5B6475" />
      <ellipse cx={x} cy={y} rx={14} ry={6} fill="#5B6475" />
      <ellipse cx={x} cy={y - 46} rx={38} ry={18} fill="#B07A45" />
      <ellipse cx={x} cy={y - 48} rx={38} ry={18} fill="#D9A06A" />
      <rect x={x + 6} y={y - 58} width={8} height={9} rx={2} fill="#FFFFFF" stroke="#C9CFD9" />
      <ellipse cx={x - 12} cy={y - 50} rx={9} ry={4} fill="#F6CB6E" />
    </g>
  );
}

export function Plant({ p, q, scale = 1 }: { p: number; q: number; scale?: number }) {
  const [x, y] = iso(p, q);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx={0} cy={2} rx={30} ry={11} fill="#C4CAD6" opacity={0.5} />
      <ellipse cx={-16} cy={-62} rx={11} ry={26} fill="#2F9E6B" transform="rotate(-25 -16 -62)" />
      <ellipse cx={16} cy={-62} rx={11} ry={26} fill="#2F9E6B" transform="rotate(25 16 -62)" />
      <ellipse cx={0} cy={-72} rx={10} ry={30} fill="#3BB37A" />
      <polygon points="-20,-38 20,-38 15,0 -15,0" fill="#C97B26" />
      <ellipse cx={0} cy={-38} rx={20} ry={6} fill="#E39A3B" />
    </g>
  );
}

/** Two-seat sofa along the far edge of the pantry, facing the work area. */
export function Sofa() {
  const base = box(652, 696, 440, 516, 16);
  const seat = box(656, 690, 446, 510, 8, 16);
  const back = box(686, 700, 436, 520, 44);
  const armL = box(652, 700, 436, 446, 30);
  const armR = box(652, 700, 510, 520, 30);
  const c = { top: '#3F9A86', front: '#2F7D6D', side: '#256859' };
  return (
    <g>
      <ellipse cx={iso(676, 478)[0]} cy={iso(676, 478)[1] + 4} rx={60} ry={22} fill="#C4CAD6" opacity={0.45} />
      {[back, armL, base, seat, armR].map((b, i) => (
        <g key={i}>
          <polygon points={b.front} fill={c.front} />
          <polygon points={b.side} fill={c.side} />
          <polygon points={b.top} fill={c.top} />
        </g>
      ))}
      <polygon points={box(668, 684, 452, 474, 12, 24).top} fill="#F6CB6E" />
      <polygon points={box(668, 684, 452, 474, 12, 24).front} fill="#E0A445" />
    </g>
  );
}
