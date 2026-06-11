import { describe, expect, test } from 'vitest';
import { SAIL_PATH } from '../../../src/lib/yait/heroScene';

const last = SAIL_PATH[SAIL_PATH.length - 1];

describe('SAIL_PATH course invariants', () => {
  test('enters offscreen left and docks at rest', () => {
    expect(SAIL_PATH[0].offset).toBe(0);
    expect(SAIL_PATH[0].xVw).toBeLessThanOrEqual(-90);
    expect(last).toEqual({ offset: 1, xVw: 0, yPx: 0, rotateDeg: 0, scale: 1 });
  });

  test('offsets strictly increase from 0 to 1', () => {
    for (let i = 1; i < SAIL_PATH.length; i++) {
      expect(SAIL_PATH[i].offset).toBeGreaterThan(SAIL_PATH[i - 1].offset);
    }
  });

  test('always approaches the dock (x strictly increases)', () => {
    for (let i = 1; i < SAIL_PATH.length; i++) {
      expect(SAIL_PATH[i].xVw).toBeGreaterThan(SAIL_PATH[i - 1].xVw);
    }
  });

  test('the course is an S: vertical drift changes direction at least twice', () => {
    const directions = [];
    for (let i = 1; i < SAIL_PATH.length; i++) {
      const dy = SAIL_PATH[i].yPx - SAIL_PATH[i - 1].yPx;
      if (dy !== 0) directions.push(Math.sign(dy));
    }
    let reversals = 0;
    for (let i = 1; i < directions.length; i++) {
      if (directions[i] !== directions[i - 1]) reversals++;
    }
    expect(reversals).toBeGreaterThanOrEqual(2);
  });

  test('amplitudes stay gentle', () => {
    for (const wp of SAIL_PATH) {
      expect(Math.abs(wp.yPx)).toBeLessThanOrEqual(24);
      expect(Math.abs(wp.rotateDeg)).toBeLessThanOrEqual(4);
      expect(wp.scale).toBeGreaterThanOrEqual(0.95);
      expect(wp.scale).toBeLessThanOrEqual(1.05);
    }
  });

  test('the boat leans into each tack (rotation sign follows vertical travel)', () => {
    for (let i = 1; i < SAIL_PATH.length - 1; i++) {
      const dy = SAIL_PATH[i].yPx - SAIL_PATH[i - 1].yPx;
      if (dy !== 0 && SAIL_PATH[i].rotateDeg !== 0) {
        expect(Math.sign(SAIL_PATH[i].rotateDeg)).toBe(Math.sign(dy));
      }
    }
  });

  test('nearer means bigger (scale tracks vertical position)', () => {
    const nearest = SAIL_PATH.reduce((a, b) => (b.yPx > a.yPx ? b : a));
    const farthest = SAIL_PATH.reduce((a, b) => (b.yPx < a.yPx ? b : a));
    expect(nearest.scale).toBeGreaterThan(farthest.scale);
  });
});
