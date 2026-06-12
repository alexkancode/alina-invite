import { describe, expect, test } from 'vitest';
import { buildWaveEdgePath, WAVE_EDGE_PATH, WAVE_GEOMETRY } from '../../../src/lib/yait/heroScene';

interface Cubic {
  c1: { x: number; y: number };
  c2: { x: number; y: number };
  to: { x: number; y: number };
}

const parseWave = (path: string) => {
  const start = path.match(/^M 0 0 L ([\d.]+) 0 /);
  const cubics: Cubic[] = [...path.matchAll(/C (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)/g)].map(m => ({
    c1: { x: Number(m[1]), y: Number(m[2]) },
    c2: { x: Number(m[3]), y: Number(m[4]) },
    to: { x: Number(m[5]), y: Number(m[6]) }
  }));
  const anchors = start
    ? [{ x: Number(start[1]), y: 0 }, ...cubics.map(c => c.to)]
    : cubics.map(c => c.to);
  return { anchors, cubics };
};

const g = WAVE_GEOMETRY;
const edgeLen = Math.hypot(g.slantPx, g.maskH);
const tHat = { x: g.slantPx / edgeLen, y: g.maskH / edgeLen };
const nHat = { x: -g.maskH / edgeLen, y: g.slantPx / edgeLen };

const toPx = (p: { x: number; y: number }) => ({ x: p.x * g.viewportW, y: p.y * g.maskH });

const edgeCoords = (anchors: { x: number; y: number }[]) => {
  const origin = toPx(anchors[0]);
  return anchors.map(a => {
    const p = toPx(a);
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return { along: dx * tHat.x + dy * tHat.y, out: dx * nHat.x + dy * nHat.y };
  });
};

describe('buildWaveEdgePath', () => {
  const path = buildWaveEdgePath(g);
  const { anchors, cubics } = parseWave(path);
  const coords = edgeCoords(anchors);

  test('is a closed clip region covering the revealed side', () => {
    expect(path.startsWith('M 0 0 ')).toBe(true);
    expect(path.endsWith('L 0 1 Z')).toBe(true);
  });

  test('the wave is anchored exactly on the slant ends', () => {
    expect(anchors[0].x).toBeCloseTo(1 - g.slantPx / g.viewportW, 4);
    expect(anchors[0].y).toBe(0);
    expect(anchors[anchors.length - 1].x).toBeCloseTo(1, 4);
    expect(anchors[anchors.length - 1].y).toBeCloseTo(1, 4);
  });

  test('the edge always advances along the slant direction', () => {
    for (let i = 1; i < coords.length; i++) {
      expect(coords[i].along).toBeGreaterThan(coords[i - 1].along);
    }
  });

  test('crests and troughs stand exactly one amplitude off the slant', () => {
    const outs = coords.map(c => c.out);
    expect(Math.max(...outs)).toBeCloseTo(g.amplitudePx, 1);
    expect(Math.min(...outs)).toBeCloseTo(-g.amplitudePx, 1);
  });

  test('eight periods produce eight crests and eight troughs', () => {
    const outs = coords.map(c => c.out);
    const extrema = [];
    for (let i = 1; i < outs.length - 1; i++) {
      const rising = outs[i] - outs[i - 1] > 0;
      const falling = outs[i + 1] - outs[i] < 0;
      if (rising === falling) extrema.push(outs[i] > 0 ? 'crest' : 'trough');
    }
    expect(extrema.filter(e => e === 'crest')).toHaveLength(g.periods);
    expect(extrema.filter(e => e === 'trough')).toHaveLength(g.periods);
  });

  test('every apex is centered between its zero crossings (no leaning crests)', () => {
    const outs = coords.map(c => c.out);
    const crossings: number[] = [coords[0].along];
    for (let i = 1; i < outs.length; i++) {
      if (Math.sign(outs[i]) !== Math.sign(outs[i - 1]) && Math.sign(outs[i]) !== 0 && Math.sign(outs[i - 1]) !== 0) {
        const f = Math.abs(outs[i - 1]) / (Math.abs(outs[i - 1]) + Math.abs(outs[i]));
        crossings.push(coords[i - 1].along + f * (coords[i].along - coords[i - 1].along));
      }
    }
    crossings.push(coords[coords.length - 1].along);
    const halfWavelength = edgeLen / (2 * g.periods);
    for (let c = 0; c + 1 < crossings.length; c++) {
      const segment = coords.filter(p => p.along > crossings[c] && p.along < crossings[c + 1]);
      if (!segment.length) continue;
      const apex = segment.reduce((a, b) => (Math.abs(b.out) > Math.abs(a.out) ? b : a));
      const midpoint = (crossings[c] + crossings[c + 1]) / 2;
      expect(Math.abs(apex.along - midpoint)).toBeLessThan(halfWavelength * 0.05);
    }
  });

  test('every joint is C1-continuous (no corners anywhere on the curve)', () => {
    for (let i = 1; i < cubics.length; i++) {
      const joint = cubics[i - 1].to;
      const incoming = { x: joint.x - cubics[i - 1].c2.x, y: joint.y - cubics[i - 1].c2.y };
      const outgoing = { x: cubics[i].c1.x - joint.x, y: cubics[i].c1.y - joint.y };
      expect(outgoing.x).toBeCloseTo(incoming.x, 4);
      expect(outgoing.y).toBeCloseTo(incoming.y, 4);
    }
  });

  test('sampling density holds at least eight cubics per period', () => {
    expect(cubics.length / g.periods).toBeGreaterThanOrEqual(8);
  });
});

describe('WAVE_EDGE_PATH constant', () => {
  test('round-trips through the per-line geometry', () => {
    expect(WAVE_GEOMETRY).toEqual({
      viewportW: 1280,
      maskH: 185,
      slantPx: 185,
      amplitudePx: 12.5,
      periods: 5,
      samples: 40
    });
    expect(WAVE_EDGE_PATH).toBe(buildWaveEdgePath(WAVE_GEOMETRY));
  });

  test('the per-line edge keeps the 45-degree slant', () => {
    expect(WAVE_GEOMETRY.slantPx).toBe(WAVE_GEOMETRY.maskH);
  });

  test('the wavelength stays near the established ripple', () => {
    const edgeLen = Math.hypot(WAVE_GEOMETRY.slantPx, WAVE_GEOMETRY.maskH);
    expect(Math.abs(edgeLen / WAVE_GEOMETRY.periods - Math.hypot(285, 287) / 8)).toBeLessThan(5);
  });
});
