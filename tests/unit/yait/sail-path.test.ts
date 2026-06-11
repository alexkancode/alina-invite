import { describe, expect, test } from 'vitest';
import { SAIL_TRACK, SAIL_WEAVE } from '../../../src/lib/yait/heroScene';

const lastTrack = SAIL_TRACK[SAIL_TRACK.length - 1];
const lastWeave = SAIL_WEAVE[SAIL_WEAVE.length - 1];

describe('SAIL_TRACK forward travel', () => {
  test('exactly three segments produce exactly three felt beats', () => {
    expect(SAIL_TRACK).toHaveLength(4);
  });

  test('enters offscreen left and ends at the dock', () => {
    expect(SAIL_TRACK[0]).toEqual({ offset: 0, xVw: -92 });
    expect(lastTrack).toEqual({ offset: 1, xVw: 0 });
  });

  test('offsets strictly increase from 0 to 1', () => {
    for (let i = 1; i < SAIL_TRACK.length; i++) {
      expect(SAIL_TRACK[i].offset).toBeGreaterThan(SAIL_TRACK[i - 1].offset);
    }
  });

  test('always approaches the dock (x strictly increases)', () => {
    for (let i = 1; i < SAIL_TRACK.length; i++) {
      expect(SAIL_TRACK[i].xVw).toBeGreaterThan(SAIL_TRACK[i - 1].xVw);
    }
  });
});

describe('SAIL_WEAVE side-to-side course', () => {
  test('starts high and far, ends level at rest', () => {
    expect(SAIL_WEAVE[0].offset).toBe(0);
    expect(SAIL_WEAVE[0].yPx).toBeLessThan(0);
    expect(lastWeave).toEqual({ offset: 1, yPx: 0, rotateDeg: 0, scale: 1 });
  });

  test('the course is an S: vertical drift changes direction at least twice', () => {
    const directions = [];
    for (let i = 1; i < SAIL_WEAVE.length; i++) {
      const dy = SAIL_WEAVE[i].yPx - SAIL_WEAVE[i - 1].yPx;
      if (dy !== 0) directions.push(Math.sign(dy));
    }
    let reversals = 0;
    for (let i = 1; i < directions.length; i++) {
      if (directions[i] !== directions[i - 1]) reversals++;
    }
    expect(reversals).toBeGreaterThanOrEqual(2);
  });

  test('amplitudes stay gentle', () => {
    for (const wp of SAIL_WEAVE) {
      expect(Math.abs(wp.yPx)).toBeLessThanOrEqual(24);
      expect(Math.abs(wp.rotateDeg)).toBeLessThanOrEqual(4);
      expect(wp.scale).toBeGreaterThanOrEqual(0.95);
      expect(wp.scale).toBeLessThanOrEqual(1.05);
    }
  });

  test('the boat leans into each tack (rotation sign follows vertical travel)', () => {
    for (let i = 1; i < SAIL_WEAVE.length - 1; i++) {
      const dy = SAIL_WEAVE[i].yPx - SAIL_WEAVE[i - 1].yPx;
      if (dy !== 0 && SAIL_WEAVE[i].rotateDeg !== 0) {
        expect(Math.sign(SAIL_WEAVE[i].rotateDeg)).toBe(Math.sign(dy));
      }
    }
  });

  test('nearer means bigger (scale tracks vertical position)', () => {
    const nearest = SAIL_WEAVE.reduce((a, b) => (b.yPx > a.yPx ? b : a));
    const farthest = SAIL_WEAVE.reduce((a, b) => (b.yPx < a.yPx ? b : a));
    expect(nearest.scale).toBeGreaterThan(farthest.scale);
  });
});

describe('the beats align', () => {
  test('every weave apex lands on a track beat', () => {
    const trackOffsets = new Set(SAIL_TRACK.map(wp => wp.offset));
    for (const wp of SAIL_WEAVE) {
      expect(trackOffsets).toContain(wp.offset);
    }
  });
});
