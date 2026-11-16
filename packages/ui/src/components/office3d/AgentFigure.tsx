import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Group } from 'three';
import type { Look, Pose } from '@/lib/look';
import { SeatedPerson3D, StandingPerson3D } from './Person3D';
import { route, type P, type Spot } from './route';

/** Walking speed in metres per second. */
const SPEED = 1.7;

type Mode = 'seated' | 'standing' | 'walking';

/** Where each visible agent is right now (x, label height, z); the label projector reads this every frame. */
export type PositionMap = Map<string, [number, number, number]>;

interface Props {
  id: string;
  look: Look;
  /** The agent's own chair on the floor, if it has a desk. */
  home: P | null;
  /** What it is doing at the desk; null when it is on a break. */
  pose: Exclude<Pose, 'idle'> | null;
  /** Its pantry spot while on a break. */
  spot: Spot | null;
  positions: RefObject<PositionMap>;
}

/**
 * One agent in the room. It sits at its desk while working, stands in the pantry on a break,
 * and walks between the two when its state changes (or jumps there when the user prefers reduced motion).
 */
export function AgentFigure({ id, look, home, pose, spot, positions }: Props) {
  const group = useRef<Group>(null);
  const pos = useRef<P | null>(null);
  const queue = useRef<P[]>([]);
  const arrival = useRef<{ mode: Mode; rot: number }>({ mode: 'standing', rot: 0 });
  const [mode, setMode] = useState<Mode>(pose && home ? 'seated' : 'standing');

  const wantSeat = Boolean(pose && home);
  const targetKey = wantSeat ? 'seat' : spot ? `spot:${spot.at.join()}` : 'none';

  useEffect(() => {
    const target: P | null = wantSeat ? home : (spot?.at ?? null);
    if (!target) return;
    const end = { mode: wantSeat ? ('seated' as const) : ('standing' as const), rot: wantSeat ? 0 : spot!.rot };
    arrival.current = end;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // First appearance, no desk to walk from/to, or reduced motion: just be there.
    if (!pos.current || !home || reduce) {
      pos.current = [target[0], target[1]];
      queue.current = [];
      group.current?.position.set(target[0], 0, target[1]);
      if (group.current) group.current.rotation.y = end.rot;
      setMode(end.mode);
      return;
    }
    queue.current = route(pos.current, mode === 'seated', wantSeat ? { home } : { spot: spot! });
    setMode(queue.current.length ? 'walking' : end.mode);
    // `mode` is read on purpose without being a dependency: only a new target starts a walk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  useFrame((_, delta) => {
    const g = group.current;
    const p = pos.current;
    if (!g || !p) return;
    let step = SPEED * Math.min(delta, 0.25);
    while (queue.current.length && step > 0) {
      const next = queue.current[0]!;
      const dx = next[0] - p[0];
      const dz = next[1] - p[1];
      const dist = Math.hypot(dx, dz);
      if (dist <= step) {
        p[0] = next[0];
        p[1] = next[1];
        step -= dist;
        queue.current.shift();
        if (!queue.current.length) {
          g.rotation.y = arrival.current.rot;
          setMode(arrival.current.mode);
        }
      } else {
        p[0] += (dx / dist) * step;
        p[1] += (dz / dist) * step;
        g.rotation.y = Math.atan2(-dx, -dz); // the figure faces -z at rotation 0
        step = 0;
      }
    }
    g.position.set(p[0], 0, p[1]);
    positions.current.set(id, [p[0], mode === 'seated' ? 1.78 : 1.98, p[1]]);
  });

  useEffect(() => {
    const map = positions.current;
    return () => void map.delete(id);
  }, [id, positions]);

  if (targetKey === 'none' && mode !== 'walking') return null;
  return (
    <group ref={group}>
      {mode === 'seated' && pose ? <SeatedPerson3D look={look} pose={pose} /> : <StandingPerson3D look={look} walking={mode === 'walking'} />}
    </group>
  );
}
