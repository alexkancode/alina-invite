import { describe, expect, test } from 'vitest';
import {
  buildRevealEdge,
  ENVELOPE_LEFT_PERCENT,
  ENVELOPE_LEFT_PERCENT_MOBILE,
  ENVELOPE_WIDTH_VW,
  ENVELOPE_WIDTH_VW_MOBILE,
  REVEAL_EDGE,
  REVEAL_EDGE_MOBILE,
  REVEAL_EDGE_TOP,
  REVEAL_EDGE_TOP_MOBILE,
  REVEAL_LOCK_VW,
  REVEAL_SAIL_SHARE,
  REVEAL_STAGGER_PX,
  staggerRevealEdge,
  SAIL_TRACK,
  SAIL_WEAVE
} from '../../../src/lib/yait/heroScene';

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

const hulls = [
  { label: 'desktop', edge: REVEAL_EDGE, left: ENVELOPE_LEFT_PERCENT, width: ENVELOPE_WIDTH_VW },
  { label: 'mobile', edge: REVEAL_EDGE_MOBILE, left: ENVELOPE_LEFT_PERCENT_MOBILE, width: ENVELOPE_WIDTH_VW_MOBILE }
];

describe.each(hulls)('REVEAL_EDGE stern-locked reveal ($label)', ({ edge, left }) => {
  test('derives from the track and the stern lock', () => {
    expect(REVEAL_LOCK_VW).toBe(0);
    expect(edge).toEqual(buildRevealEdge(SAIL_TRACK, { leftPercent: left, lockVw: REVEAL_LOCK_VW }));
  });

  test('track offsets are rescaled into the sail share, then the settle finishes', () => {
    const expected = SAIL_TRACK.map(wp => Math.round(wp.offset * REVEAL_SAIL_SHARE * 10000) / 10000);
    expect(edge.map(wp => wp.offset)).toEqual([...expected, 1]);
  });

  test('nothing reveals until the stern enters the screen', () => {
    expect(edge[0].percent).toBeLessThanOrEqual(-100);
    expect(edge[edge.length - 1].percent).toBe(0);
  });

  test('the edge only ever advances', () => {
    for (let i = 1; i < edge.length; i++) {
      expect(edge[i].percent).toBeGreaterThan(edge[i - 1].percent);
    }
  });

  test('each sailing waypoint sits exactly at the stern', () => {
    for (let i = 0; i < SAIL_TRACK.length; i++) {
      expect(edge[i].percent).toBe(SAIL_TRACK[i].xVw + left + REVEAL_LOCK_VW - 100);
    }
  });

  test('the settle finishes exactly the docked remainder', () => {
    expect(edge[edge.length - 2].percent).toBe(left + REVEAL_LOCK_VW - 100);
  });
});

describe('staggered top-line reveal edge', () => {
  const staggerPercent = (REVEAL_STAGGER_PX / 1280) * 100;
  const pairs = [
    { label: 'desktop', base: REVEAL_EDGE, top: REVEAL_EDGE_TOP },
    { label: 'mobile', base: REVEAL_EDGE_MOBILE, top: REVEAL_EDGE_TOP_MOBILE }
  ];

  test('the stagger is 50px at the reference viewport', () => {
    expect(REVEAL_STAGGER_PX).toBe(50);
    expect(staggerPercent).toBe(3.90625);
  });

  test.each(pairs)('$label: every sweeping waypoint trails by exactly the stagger', ({ base, top }) => {
    expect(top).toEqual(staggerRevealEdge(base, REVEAL_STAGGER_PX, 1280));
    expect(top).toHaveLength(base.length);
    for (let i = 0; i < base.length - 1; i++) {
      expect(top[i].offset).toBe(base[i].offset);
      expect(top[i].percent).toBeCloseTo(base[i].percent - staggerPercent, 5);
    }
  });

  test.each(pairs)('$label: both lines converge fully revealed at the end', ({ base, top }) => {
    expect(top[top.length - 1]).toEqual({ offset: 1, percent: 0 });
    expect(base[base.length - 1]).toEqual({ offset: 1, percent: 0 });
  });

  test.each(pairs)('$label: the trailing edge still only ever advances', ({ top }) => {
    for (let i = 1; i < top.length; i++) {
      expect(top[i].percent).toBeGreaterThan(top[i - 1].percent);
    }
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
