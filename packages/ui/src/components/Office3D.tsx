import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import { Vector3 } from 'three';
import type { AgentState } from '@agentpals/core';
import { DEFAULT_LOOKS, SOURCE_LABEL, STATUS, agentName, truncate } from '@/lib/look';
import { Room, SharedDesk, Workstation } from './office3d/Furniture';
import { SeatedPerson3D, StandingPerson3D } from './office3d/Person3D';

type V3 = [number, number, number];

const DESK: V3 = [-2.5, 0, 0.9];

/** Seats at the shared desk: x offset from the desk centre, and which side. Agent i owns seat i. */
const SEATS = [
  { x: -1.4, flip: false },
  { x: 1.4, flip: false },
  { x: -1.4, flip: true },
  { x: 1.4, flip: true },
] as const;

/** Where idle agents stand in the pantry (world position, rotation around y). */
const PANTRY_SPOTS: Array<{ at: V3; rot: number }> = [
  { at: [4.3, 0, 0.55], rot: Math.PI + 0.95 },
  { at: [5.85, 0, 0.1], rot: Math.PI - 0.85 },
  { at: [3.95, 0, -3.3], rot: Math.PI + 0.35 },
  { at: [5.3, 0, -3.25], rot: Math.PI - 0.3 },
];

const lookFor = (i: number) => DEFAULT_LOOKS[i % DEFAULT_LOOKS.length]!;

interface Anchor {
  agent: AgentState;
  /** World point the label sits on (just above the head). */
  at: V3;
}

type LabelMap = Map<string, HTMLDivElement>;

/** Runs inside the canvas: projects each anchor to screen space and moves its DOM label there. */
function LabelProjector({ anchors, labels }: { anchors: Anchor[]; labels: RefObject<LabelMap> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const items: Array<{ el: HTMLDivElement; x: number; y: number; w: number; h: number }> = [];
    for (const a of anchors) {
      const el = labels.current.get(a.agent.agentId);
      if (!el) continue;
      v.set(...a.at).project(camera);
      if (v.z >= 1) {
        el.style.visibility = 'hidden';
        continue;
      }
      const w = el.offsetWidth;
      // keep the label inside the canvas
      const x = Math.min(Math.max((v.x * 0.5 + 0.5) * size.width, w / 2 + 6), size.width - w / 2 - 6);
      items.push({ el, x, y: (-v.y * 0.5 + 0.5) * size.height, w, h: el.offsetHeight });
    }
    // Nearest (lowest on screen) labels keep their spot; labels behind them move up until they are clear.
    items.sort((p, q) => q.y - p.y);
    const placed: typeof items = [];
    for (const it of items) {
      for (let moved = true; moved; ) {
        moved = false;
        for (const o of placed) {
          if (Math.abs(it.x - o.x) < (it.w + o.w) / 2 + 4 && it.y > o.y - o.h && it.y - it.h < o.y) {
            it.y = o.y - o.h - 2;
            moved = true;
          }
        }
      }
      placed.push(it);
      it.el.style.transform = `translate(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px) translate(-50%, -100%)`;
      it.el.style.visibility = 'visible';
    }
  });
  return null;
}

function Label({ agent }: { agent: AgentState }) {
  const meta = STATUS[agent.status];
  const idle = meta.pose === 'idle';
  return (
    <div className={`b3d ${meta.pose === 'waiting' ? 'b3d-waiting' : ''} ${idle ? 'b3d-tag' : ''}`}>
      <i style={{ background: idle ? (agent.source === 'codex' ? '#1C2230' : '#D97757') : meta.screen }} />
      <div>
        <strong>{truncate(idle ? agentName(agent) : `${agentName(agent)} · ${SOURCE_LABEL[agent.source]}`, 26)}</strong>
        {!idle && <span>{truncate(agent.detail ?? meta.label, 30)}</span>}
      </div>
    </div>
  );
}

export default function Office3D({ agents }: { agents: AgentState[] }) {
  const idle = agents
    .map((agent, i) => ({ agent, i }))
    .filter(({ agent }) => STATUS[agent.status].pose === 'idle')
    .slice(0, PANTRY_SPOTS.length);

  const labels = useRef<LabelMap>(new Map());
  const anchors: Anchor[] = [];
  SEATS.forEach((seat, i) => {
    const agent = agents[i];
    if (agent && STATUS[agent.status].pose !== 'idle') anchors.push({ agent, at: [DESK[0] + seat.x, 1.72, DESK[2] + (seat.flip ? -1.25 : 1.25)] });
  });
  idle.forEach(({ agent }, k) => {
    const spot = PANTRY_SPOTS[k]!;
    anchors.push({ agent, at: [spot.at[0], 1.98, spot.at[2]] });
  });

  return (
    <div className="office3d" role="img" aria-label="Văn phòng 3D của các agent">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [5.6, 8.3, 13.4], fov: 30 }} gl={{ antialias: true }}>
        <color attach="background" args={['#ECE8E1']} />
        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#FFF4E3', '#7A6A58', 0.7]} />
        <directionalLight
          position={[5, 11, 7]}
          intensity={1.7}
          color="#FFF1DC"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.002}
          shadow-normalBias={0.04}
          shadow-camera-near={1}
          shadow-camera-far={40}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />

        <Room desk={DESK} />

        <group position={DESK}>
          <SharedDesk />
          {SEATS.map((seat, i) => {
            const agent = agents[i];
            const meta = agent ? STATUS[agent.status] : null;
            const pose = meta && meta.pose !== 'idle' ? meta.pose : null;
            return (
              <Workstation key={i} x={seat.x} flip={seat.flip} pose={pose} accent={meta?.screen ?? '#2F6FD6'}>
                {agent && pose && <SeatedPerson3D look={lookFor(i)} pose={pose} />}
              </Workstation>
            );
          })}
        </group>

        {idle.map(({ agent, i }, k) => {
          const spot = PANTRY_SPOTS[k]!;
          return (
            <group key={agent.agentId} position={spot.at} rotation={[0, spot.rot, 0]}>
              <StandingPerson3D look={lookFor(i)} />
            </group>
          );
        })}

        <LabelProjector anchors={anchors} labels={labels} />
        <OrbitControls
          target={[0.55, 0.6, -0.9]}
          enablePan={false}
          minDistance={8}
          maxDistance={24}
          minPolarAngle={0.5}
          maxPolarAngle={1.35}
          minAzimuthAngle={-0.35}
          maxAzimuthAngle={1.2}
        />
      </Canvas>
      {anchors.map(({ agent }) => (
        <div
          key={agent.agentId}
          className="b3d-wrap"
          ref={(el) => {
            if (el) labels.current.set(agent.agentId, el);
            else labels.current.delete(agent.agentId);
          }}
        >
          <Label agent={agent} />
        </div>
      ))}
    </div>
  );
}
