import { describe, expect, test } from 'vitest';
import {
  buildWhipEdgePath,
  whipCenters,
  WHIP,
  WHIP_CENTER_MAX,
  WHIP_CENTER_MIN,
  WHIP_EDGE_FRAMES,
  WHIP_GEOMETRY,
  WHIP_HALF_FRAMES
} from '../../../src/lib/yait/heroScene';

interface Cubic {
  c1: { x: number; y: number };
  c2: { x: number; y: number };
  to: { x: number; y: number };
}

const parsePath = (path: string) => {
  const start = path.match(/^M -0\.5 -0\.5 L (-?[\d.]+) -0\.5 L (-?[\d.]+) (-?[\d.]+) /);
  const cubics: Cubic[] = [...path.matchAll(/C (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)/g)].map(m => ({
    c1: { x: Number(m[1]), y: Number(m[2]) },
    c2: { x: Number(m[3]), y: Number(m[4]) },
    to: { x: Number(m[5]), y: Number(m[6]) }
  }));
  const anchors = start
    ? [{ x: Number(start[2]), y: Number(start[3]) }, ...cubics.map(c => c.to)]
    : cubics.map(c => c.to);
  return { anchors, cubics };
};

const g = WHIP_GEOMETRY;
const edgeLen = Math.hypot(g.slantPx, g.maskH);
const tHat = { x: g.slantPx / edgeLen, y: g.maskH / edgeLen };
const nHat = { x: -g.maskH / edgeLen, y: g.slantPx / edgeLen };
const toPx = (p: { x: number; y: number }) => ({ x: p.x * g.viewportW, y: p.y * g.maskH });

const project = (anchors: { x: number; y: number }[]) => {
  const origin = toPx({ x: 1 - g.slantPx / g.viewportW, y: 0 });
  return anchors.map(a => {
    const p = toPx(a);
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return { along: dx * tHat.x + dy * tHat.y, out: dx * nHat.x + dy * nHat.y };
  });
};
const outOffsets = (anchors: { x: number; y: number }[]) => project(anchors).map(c => c.out);

describe('WHIP_GEOMETRY', () => {
  test('is a 45-degree slant with the tuned bump shape', () => {
    expect(WHIP_GEOMETRY).toEqual({
      viewportW: 1280,
      maskH: 370,
      slantPx: 370,
      amplitudePx: 34,
      widthFrac: 0.16667,
      samples: 28
    });
    expect(WHIP_GEOMETRY.slantPx).toBe(WHIP_GEOMETRY.maskH);
  });
});

describe('buildWhipEdgePath', () => {
  const path = buildWhipEdgePath(g, 0.5);
  const { anchors, cubics } = parsePath(path);
  const outs = outOffsets(anchors);

  test('is a closed clip region with the standard enclosure', () => {
    expect(path.startsWith('M -0.5 -0.5 ')).toBe(true);
    expect(path.endsWith('L -0.5 1.5 Z')).toBe(true);
  });

  test('carries exactly one bump of height ~amplitude', () => {
    const peak = Math.max(...outs);
    expect(peak).toBeCloseTo(g.amplitudePx, 0);
    const lobes = outs.filter((o, i) => i > 0 && i < outs.length - 1 && o > g.amplitudePx * 0.5 && o >= outs[i - 1] && o >= outs[i + 1]);
    expect(lobes).toHaveLength(1);
  });

  test('the baseline is straight away from the bump (no residual waviness)', () => {
    const farFromCenter = anchors.map((a, i) => ({ s: a.y, out: outs[i] })).filter(p => Math.abs(p.s - 0.5) > 0.3);
    for (const p of farFromCenter) {
      expect(Math.abs(p.out)).toBeLessThan(1);
    }
  });

  test('the slant ends are effectively flat for any in-range center', () => {
    for (const center of [WHIP_CENTER_MIN, 0.5, WHIP_CENTER_MAX]) {
      const o = outOffsets(parsePath(buildWhipEdgePath(g, center)).anchors);
      expect(Math.abs(o[0])).toBeLessThan(1);
      expect(Math.abs(o[o.length - 1])).toBeLessThan(1);
    }
  });

  test('the edge always advances down the slant (no fold)', () => {
    const along = project(anchors).map(c => c.along);
    for (let i = 1; i < along.length; i++) {
      expect(along[i]).toBeGreaterThan(along[i - 1]);
    }
  });

  test('every joint is C1-continuous (no corners)', () => {
    for (let i = 1; i < cubics.length; i++) {
      const joint = cubics[i - 1].to;
      const incoming = { x: joint.x - cubics[i - 1].c2.x, y: joint.y - cubics[i - 1].c2.y };
      const outgoing = { x: cubics[i].c1.x - joint.x, y: cubics[i].c1.y - joint.y };
      expect(outgoing.x).toBeCloseTo(incoming.x, 4);
      expect(outgoing.y).toBeCloseTo(incoming.y, 4);
    }
  });
});

describe('whipCenters', () => {
  test('is a seamless triangle ping-pong between the bounds', () => {
    const c = whipCenters(WHIP_CENTER_MIN, WHIP_CENTER_MAX, WHIP_HALF_FRAMES);
    expect(c).toHaveLength(2 * WHIP_HALF_FRAMES + 1);
    expect(c[0]).toBe(WHIP_CENTER_MIN);
    expect(c[WHIP_HALF_FRAMES]).toBe(WHIP_CENTER_MAX);
    expect(c[c.length - 1]).toBe(WHIP_CENTER_MIN);
    for (let i = 1; i <= WHIP_HALF_FRAMES; i++) expect(c[i]).toBeGreaterThan(c[i - 1]);
    for (let i = WHIP_HALF_FRAMES + 1; i < c.length; i++) expect(c[i]).toBeLessThan(c[i - 1]);
  });
});

describe('WHIP_EDGE_FRAMES', () => {
  test('every frame shares the same cubic count so the d morph interpolates', () => {
    const counts = WHIP_EDGE_FRAMES.map(f => (f.match(/C /g) ?? []).length);
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBe(WHIP_GEOMETRY.samples);
  });

  test('loops seamlessly: first frame equals last', () => {
    expect(WHIP_EDGE_FRAMES.length).toBe(2 * WHIP_HALF_FRAMES + 1);
    expect(WHIP_EDGE_FRAMES[0]).toBe(WHIP_EDGE_FRAMES[WHIP_EDGE_FRAMES.length - 1]);
  });

  test('the bump actually moves between frames', () => {
    expect(WHIP_EDGE_FRAMES[0]).not.toBe(WHIP_EDGE_FRAMES[WHIP_HALF_FRAMES]);
  });
});

describe('WHIP timing', () => {
  test('one full down-and-back crack every 2222ms (gallery cadence, 1.5x faster)', () => {
    expect(WHIP.durationMs).toBe(2222);
  });
});
