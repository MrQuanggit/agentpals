/** Floor point: [x, z]. */
export type P = [number, number];

export interface Spot {
  /** Where the agent stands (floor). */
  at: P;
  /** Facing, rotation around y. */
  rot: number;
  /** Extra points between the pantry entrance and the spot, to walk around furniture. */
  via?: P[];
}

/** Walkway behind the chairs, parallel to the desk row. */
export const AISLE_Z = 0.35;
/** Where the walkway meets the pantry. */
export const DOOR_X = 3.3;
/** How far a chair is pushed back from when standing up / sitting down. */
const STEP_BACK = 0.7;

const same = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05;

/**
 * Waypoints from `from` to a pantry spot or back to the agent's own chair (`home`).
 * Works from any point on the way, so an agent that is called back mid-walk just turns around.
 */
export function route(from: P, seated: boolean, to: { spot: Spot } | { home: P }): P[] {
  const pts: P[] = [];
  if ('spot' in to) {
    if (seated) pts.push([from[0], from[1] + STEP_BACK]);
    if (from[0] < DOOR_X) pts.push([from[0], AISLE_Z], [DOOR_X, AISLE_Z]);
    pts.push(...(to.spot.via ?? []), to.spot.at);
  } else {
    if (from[0] >= DOOR_X) pts.push([DOOR_X, AISLE_Z]);
    else pts.push([from[0], AISLE_Z]);
    pts.push([to.home[0], AISLE_Z], [to.home[0], to.home[1] + STEP_BACK], to.home);
  }
  // drop points we are already standing on
  const out: P[] = [];
  let prev = from;
  for (const p of pts) {
    if (!same(prev, p)) out.push(p);
    prev = p;
  }
  return out;
}

/** Keep each idle agent on the same pantry spot for as long as it stays idle. */
export function assignSpots(prev: Map<string, number>, idleIds: string[], spotCount: number): Map<string, number> {
  const next = new Map<string, number>();
  for (const id of idleIds) {
    const k = prev.get(id);
    if (k !== undefined && k < spotCount) next.set(id, k);
  }
  for (const id of idleIds) {
    if (next.has(id)) continue;
    const used = new Set(next.values());
    for (let k = 0; k < spotCount; k++) {
      if (!used.has(k)) {
        next.set(id, k);
        break;
      }
    }
  }
  return next;
}
