/**
 * Isometric helpers. The floor is a rhombus spanned by two axes:
 *   p → runs down-right along the right wall, q → runs down-left along the left wall.
 * iso(p, q) turns floor coordinates into SVG screen coordinates.
 */
export const ORIGIN = { x: 560, y: 120 };
export const ROOM = { p: 700, q: 520, wall: 140 };
/** Floor area where the pantry starts (p ≥ PANTRY_P). */
export const PANTRY_P = 450;

export const VIEWBOX = '0 -30 1300 790';

export function iso(p: number, q: number, h = 0): [number, number] {
  return [ORIGIN.x + p - q, ORIGIN.y + (p + q) / 2 - h];
}

export function pts(...points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

/** Corners of an axis-aligned box on the floor: [p0,p1] × [q0,q1], height h, lifted by base. */
export function box(p0: number, p1: number, q0: number, q1: number, h: number, base = 0) {
  const top = pts(iso(p0, q0, base + h), iso(p1, q0, base + h), iso(p1, q1, base + h), iso(p0, q1, base + h));
  // face looking down-left (+q side) and face looking down-right (+p side)
  const front = pts(iso(p0, q1, base), iso(p1, q1, base), iso(p1, q1, base + h), iso(p0, q1, base + h));
  const side = pts(iso(p1, q0, base), iso(p1, q1, base), iso(p1, q1, base + h), iso(p1, q0, base + h));
  return { top, front, side };
}

/** A rectangle drawn flat on the right wall (q = 0) between p0..p1 and heights h0..h1. */
export function rightWallRect(p0: number, p1: number, h0: number, h1: number) {
  return pts(iso(p0, 0, h0), iso(p1, 0, h0), iso(p1, 0, h1), iso(p0, 0, h1));
}

/** A rectangle drawn flat on the left wall (p = 0) between q0..q1 and heights h0..h1. */
export function leftWallRect(q0: number, q1: number, h0: number, h1: number) {
  return pts(iso(0, q0, h0), iso(0, q1, h0), iso(0, q1, h1), iso(0, q0, h1));
}
