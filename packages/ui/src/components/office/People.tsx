import type { Look, Pose } from '@/lib/look';

const SHADE = { fill: '#000000', opacity: 0.14 };
const OUTLINE = '#2B2F38';

/** A bent arm: shoulder → elbow → hand, sleeve in shirt colour, hand in skin. */
function Arm({ s, e, h, look, className }: { s: [number, number]; e: [number, number]; h: [number, number]; look: Look; className?: string }) {
  return (
    <g className={className}>
      <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]} L${h[0]},${h[1]}`} fill="none" stroke={look.shirt} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${s[0]},${s[1]} L${e[0]},${e[1]} L${h[0]},${h[1]}`} fill="none" stroke="#000" strokeOpacity={0.08} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={h[0]} cy={h[1]} rx={5} ry={4} fill={look.skin} />
    </g>
  );
}

function Shoe({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={11} ry={4.5} fill="#1C2028" opacity={0.9} />
      <ellipse cx={x} cy={y} rx={10} ry={5} fill={color} stroke={color === '#F4F4F2' ? '#C9CFD9' : 'none'} />
    </g>
  );
}

/** Back three-quarter view of the hair; the face side (lower left) stays visible. */
function HairBack({ look, cx, cy }: { look: Look; cx: number; cy: number }) {
  const t = (dx: number, dy: number) => `${cx + dx},${cy + dy}`;
  const c = look.hair;
  return (
    <g>
      {look.hairStyle === 'long' && <path d={`M${t(4, -12)} Q${t(20, -8)} ${t(18, 10)} Q${t(17, 24)} ${t(12, 30)} Q${t(2, 28)} ${t(1, 18)} Q${t(10, 8)} ${t(4, -12)} Z`} fill={c} />}
      <path
        d={`M${t(-15, -2)} Q${t(-16, -17)} ${t(0, -18)} Q${t(16, -18)} ${t(16, -2)} Q${t(16, 8)} ${t(11, 12)} Q${t(9, 2)} ${t(0, 0)} Q${t(-6, -1)} ${t(-10, 4)} Q${t(-14, 3)} ${t(-15, -2)} Z`}
        fill={c}
      />
      {look.hairStyle === 'bun' && (
        <>
          <circle cx={cx + 9} cy={cy - 19} r={7} fill={c} />
          <path d={`M${t(4, -21)} q5,-4 10,0`} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1.5} fill="none" />
        </>
      )}
      {look.hairStyle === 'curly' &&
        [
          [-12, -6, 7],
          [-6, -14, 8],
          [4, -16, 8],
          [12, -10, 7],
          [15, 0, 6],
          [11, 8, 5],
        ].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx!} cy={cy + dy!} r={r} fill={c} />)}
      <path d={`M${t(-8, -12)} Q${t(2, -17)} ${t(10, -11)}`} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Seated at a desk, seen from behind, facing the monitors (local desk coordinates). */
export function SeatedPerson({ look, pose }: { look: Look; pose: Pose }) {
  const head = { x: 86, y: -48 };
  return (
    <g>
      {/* legs: back leg first */}
      <path d="M100,14 L76,2 L74,44" fill="none" stroke={look.pants} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100,14 L76,2 L74,44" fill="none" stroke="#000" strokeOpacity={0.18} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <Shoe x={70} y={47} color={look.shoes} />
      <path d="M84,22 L60,10 L58,52" fill="none" stroke={look.pants} strokeWidth={12.5} strokeLinecap="round" strokeLinejoin="round" />
      <Shoe x={54} y={55} color={look.shoes} />

      {/* back arm */}
      {pose === 'typing' && <Arm s={[98, -20]} e={[80, 0]} h={[50, -14]} look={look} className="bob-b" />}
      {pose === 'reading' && <Arm s={[98, -20]} e={[86, 0]} h={[66, -26]} look={look} />}
      {pose === 'waiting' && <Arm s={[98, -20]} e={[80, 0]} h={[52, -14]} look={look} />}

      {/* torso */}
      <path d="M62,-8 Q64,-26 82,-31 Q100,-34 106,-24 L108,8 Q92,26 72,28 Q61,14 62,-8 Z" fill={look.shirt} />
      <path d="M98,-32 Q106,-28 108,-20 L108,8 Q102,14 95,17 Q101,-6 98,-32 Z" {...SHADE} />
      <path d="M70,-20 Q72,4 74,22" stroke="#000" strokeOpacity={0.1} strokeWidth={1.5} fill="none" />

      {/* neck + collar / hood */}
      <rect x={80} y={-38} width={11} height={10} rx={3} fill={look.skin} />
      <rect x={80} y={-38} width={11} height={10} rx={3} {...SHADE} />
      {look.hoodie ? (
        <>
          <path d="M72,-27 Q86,-37 102,-30 Q101,-19 88,-19 Q76,-19 72,-27 Z" fill={look.shirt} />
          <path d="M72,-27 Q86,-37 102,-30 Q101,-19 88,-19 Q76,-19 72,-27 Z" fill="#000" opacity={0.1} />
          <path d="M77,-26 Q87,-31 97,-27" stroke="#000" strokeOpacity={0.2} strokeWidth={1.5} fill="none" />
        </>
      ) : (
        <path d="M76,-29 Q86,-33 98,-29" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      )}

      {/* head */}
      <circle cx={head.x} cy={head.y} r={14.5} fill={look.skin} />
      <ellipse cx={head.x - 9} cy={head.y + 1} rx={3.2} ry={4.6} fill={look.skin} />
      <ellipse cx={head.x - 9} cy={head.y + 1} rx={1.6} ry={2.6} {...SHADE} />
      <HairBack look={look} cx={head.x} cy={head.y} />
      {look.accessory === 'headphones' && (
        <>
          <path d={`M${head.x - 11},${head.y - 4} Q${head.x - 2},${head.y - 24} ${head.x + 15},${head.y - 8}`} stroke={OUTLINE} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <ellipse cx={head.x - 10} cy={head.y + 1} rx={5} ry={6.5} fill={OUTLINE} />
          <ellipse cx={head.x - 10.5} cy={head.y + 1} rx={2.5} ry={4} fill="#E07B39" />
        </>
      )}
      {look.accessory === 'glasses' && <path d={`M${head.x - 8},${head.y - 3} L${head.x - 18},${head.y - 4} L${head.x - 19},${head.y + 3}`} stroke={OUTLINE} strokeWidth={1.8} fill="none" strokeLinecap="round" />}

      {/* front arm (drawn over the torso) */}
      {pose === 'typing' && <Arm s={[66, -14]} e={[54, 6]} h={[34, -6]} look={look} className="bob-a" />}
      {pose === 'reading' && <Arm s={[66, -14]} e={[52, -2]} h={[72, -36]} look={look} />}
      {pose === 'waiting' && <Arm s={[66, -14]} e={[54, -34]} h={[48, -60]} look={look} className="wave" />}
    </g>
  );
}

/** Hair seen from the front three-quarter view. */
function HairFront({ look, cx, cy }: { look: Look; cx: number; cy: number }) {
  const t = (dx: number, dy: number) => `${cx + dx},${cy + dy}`;
  const c = look.hair;
  return (
    <g>
      {look.hairStyle === 'long' && <path d={`M${t(-14, -4)} Q${t(-17, 12)} ${t(-13, 22)} L${t(-7, 20)} Q${t(-9, 6)} ${t(-8, -2)} Z M${t(14, -4)} Q${t(17, 12)} ${t(13, 22)} L${t(7, 20)} Q${t(9, 6)} ${t(8, -2)} Z`} fill={c} />}
      <path d={`M${t(-14, 0)} Q${t(-15, -15)} ${t(0, -15)} Q${t(15, -15)} ${t(14, 0)} Q${t(10, -7)} ${t(2, -8)} Q${t(-6, -6)} ${t(-14, 0)} Z`} fill={c} />
      {look.hairStyle === 'bun' && <circle cx={cx + 2} cy={cy - 17} r={6.5} fill={c} />}
      {look.hairStyle === 'curly' &&
        [
          [-12, -4, 6],
          [-7, -12, 7],
          [2, -14, 7],
          [10, -10, 6.5],
          [13, -2, 5],
        ].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx!} cy={cy + dy!} r={r} fill={c} />)}
      <path d={`M${t(-7, -11)} Q${t(1, -14)} ${t(8, -11)}`} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Standing with a mug, facing the viewer (local origin at the feet). Mirror with scale(-1,1). */
export function StandingPerson({ look }: { look: Look }) {
  const head = { x: 0, y: -100 };
  return (
    <g>
      <ellipse cx={0} cy={0} rx={22} ry={8} fill="#1C2028" opacity={0.15} />
      {/* legs */}
      <path d="M5,-46 L7,-6" stroke={look.pants} strokeWidth={11} strokeLinecap="round" />
      <path d="M5,-46 L7,-6" stroke="#000" strokeOpacity={0.18} strokeWidth={11} strokeLinecap="round" />
      <path d="M-7,-46 L-8,-5" stroke={look.pants} strokeWidth={11.5} strokeLinecap="round" />
      <Shoe x={8} y={-3} color={look.shoes} />
      <Shoe x={-10} y={-2} color={look.shoes} />

      {/* arm hanging behind */}
      <path d="M15,-76 L19,-58 L17,-42" fill="none" stroke={look.shirt} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15,-76 L19,-58 L17,-42" fill="none" stroke="#000" strokeOpacity={0.15} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={17} cy={-40} rx={4.5} ry={4} fill={look.skin} />

      {/* torso */}
      <path d="M-16,-44 Q-19,-70 -10,-80 Q0,-86 11,-80 Q18,-70 16,-44 Q0,-38 -16,-44 Z" fill={look.shirt} />
      <path d="M6,-82 Q18,-72 16,-44 Q11,-42 7,-41 Q12,-62 6,-82 Z" {...SHADE} />
      {look.hoodie ? (
        <>
          <path d="M-9,-83 Q0,-74 9,-83" stroke="#000" strokeOpacity={0.2} strokeWidth={2} fill="none" />
          <line x1={-3} y1={-78} x2={-4} y2={-66} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.5} />
          <line x1={3} y1={-78} x2={4} y2={-67} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.5} />
          <path d="M-9,-58 Q0,-55 9,-58 L8,-50 Q0,-48 -8,-50 Z" fill="#000" opacity={0.1} />
        </>
      ) : (
        <path d="M-7,-83 L0,-75 L7,-83" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      )}

      {/* neck + head */}
      <rect x={-4.5} y={-90} width={9} height={8} rx={3} fill={look.skin} />
      <rect x={-4.5} y={-90} width={9} height={8} rx={3} {...SHADE} />
      <circle cx={head.x} cy={head.y} r={13} fill={look.skin} />
      <ellipse cx={head.x + 12} cy={head.y + 1} rx={2.6} ry={4} fill={look.skin} />
      <circle cx={head.x - 6} cy={head.y + 1} r={1.8} fill={OUTLINE} />
      <circle cx={head.x + 3} cy={head.y + 1} r={1.8} fill={OUTLINE} />
      <path d={`M${head.x - 5},${head.y + 7} Q${head.x - 2},${head.y + 10} ${head.x + 2},${head.y + 7}`} stroke={OUTLINE} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <circle cx={head.x - 9} cy={head.y + 5} r={2.4} fill="#E86F6F" opacity={0.25} />
      <circle cx={head.x + 6} cy={head.y + 5} r={2.4} fill="#E86F6F" opacity={0.25} />
      <HairFront look={look} cx={head.x} cy={head.y} />
      {look.accessory === 'glasses' && (
        <g stroke={OUTLINE} strokeWidth={1.5} fill="none">
          <circle cx={head.x - 6} cy={head.y + 1} r={4.2} />
          <circle cx={head.x + 3.5} cy={head.y + 1} r={4.2} />
          <line x1={head.x - 1.8} y1={head.y + 1} x2={head.x - 0.7} y2={head.y + 1} />
        </g>
      )}
      {look.accessory === 'headphones' && (
        // worn around the neck while on a break
        <path d="M-11,-86 Q0,-78 11,-86" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" />
      )}

      {/* front arm holding a mug */}
      <path d="M-14,-76 L-18,-58 L-5,-58" fill="none" stroke={look.shirt} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={-6} y={-67} width={11} height={12} rx={2.5} fill="#FFFFFF" stroke="#C9CFD9" />
      <path d="M5,-64 q5,1 0,7" stroke="#C9CFD9" strokeWidth={2} fill="none" />
      <ellipse cx={-6} cy={-59} rx={4.5} ry={4} fill={look.skin} />
      <g className="steam">
        <path d="M-2,-71 q-3,-4 0,-8 q3,-4 0,-8" stroke="#9AA1AD" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M3,-71 q-3,-4 0,-8" stroke="#9AA1AD" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.5} />
      </g>
    </g>
  );
}
