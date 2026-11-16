import { describe, expect, it } from 'vitest';
import { AISLE_Z, DOOR_X, assignSpots, route, type Spot } from './route.ts';

const spot: Spot = { at: [5.85, 0.1], rot: 0, via: [[4.9, -0.8]] };
const home: [number, number] = [-3.3, -1.15];
const r = (pts: Array<[number, number]>) => pts.map(([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100]);

describe('route', () => {
  it('stands up, takes the walkway, enters the pantry and goes around the table', () => {
    expect(r(route(home, true, { spot }))).toEqual([[-3.3, -0.45], [-3.3, AISLE_Z], [DOOR_X, AISLE_Z], [4.9, -0.8], [5.85, 0.1]]);
  });

  it('walks back the same way and ends on the chair', () => {
    const back = route(spot.at, false, { home });
    expect(back[0]).toEqual([DOOR_X, AISLE_Z]);
    expect(back.at(-1)).toEqual(home);
    expect(back).toContainEqual([-3.3, AISLE_Z]);
  });

  it('turns around when called back half-way', () => {
    expect(r(route([0.5, AISLE_Z], false, { home }))).toEqual([[-3.3, AISLE_Z], [-3.3, -0.45], home]);
  });
});

describe('assignSpots', () => {
  it('keeps people where they are and fills the lowest free spot', () => {
    const a = assignSpots(new Map(), ['x', 'y'], 4);
    expect([...a]).toEqual([['x', 0], ['y', 1]]);
    const b = assignSpots(a, ['y', 'z'], 4);
    expect(b.get('y')).toBe(1);
    expect(b.get('z')).toBe(0);
  });

  it('leaves extra agents without a spot', () => {
    expect(assignSpots(new Map(), ['a', 'b', 'c'], 2).has('c')).toBe(false);
  });
});
