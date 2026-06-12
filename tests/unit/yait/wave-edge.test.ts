import { describe, expect, test } from 'vitest';
import { buildWaveEdgePath, WAVE_EDGE_PATH, WAVE_REFERENCE, WAVE_SPEC } from '../../../src/lib/yait/heroScene';

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

describe('buildWaveEdgePath', () => {
  const path = buildWaveEdgePath(WAVE_SPEC);
  const { anchors, cubics } = parseWave(path);
  const x0 = 1 - WAVE_SPEC.slantFracX;
  const deviations = anchors.map(p => p.x - (x0 + WAVE_SPEC.slantFracX * p.y));

  test('is a closed clip region covering the revealed side', () => {
    expect(path.startsWith('M 0 0 ')).toBe(true);
    expect(path.endsWith('L 0 1 Z')).toBe(true);
  });

  test('the wave is drawn with cubic segments anchored on the slant ends', () => {
    expect(cubics.length).toBeGreaterThan(0);
    expect(anchors[0].x).toBeCloseTo(x0, 4);
    expect(anchors[0].y).toBe(0);
    expect(anchors[anchors.length - 1].x).toBeCloseTo(1, 4);
    expect(anchors[anchors.length - 1].y).toBe(1);
  });

  test('the edge descends monotonically', () => {
    for (let i = 1; i < anchors.length; i++) {
      expect(anchors[i].y).toBeGreaterThan(anchors[i - 1].y);
    }
  });

  test('crests and troughs deviate by the amplitude', () => {
    expect(Math.max(...deviations)).toBeCloseTo(WAVE_SPEC.ampFracX, 3);
    expect(Math.min(...deviations)).toBeCloseTo(-WAVE_SPEC.ampFracX, 3);
  });

  test('eight periods produce eight crests and eight troughs', () => {
    const extrema = [];
    for (let i = 1; i < deviations.length - 1; i++) {
      const rising = deviations[i] - deviations[i - 1] > 0;
      const falling = deviations[i + 1] - deviations[i] < 0;
      if (rising === falling) extrema.push(deviations[i] > 0 ? 'crest' : 'trough');
    }
    expect(extrema.filter(e => e === 'crest')).toHaveLength(WAVE_SPEC.periods);
    expect(extrema.filter(e => e === 'trough')).toHaveLength(WAVE_SPEC.periods);
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
    expect(cubics.length / WAVE_SPEC.periods).toBeGreaterThanOrEqual(8);
  });
});

describe('WAVE_EDGE_PATH constant', () => {
  test('round-trips through the reference geometry', () => {
    expect(WAVE_REFERENCE).toEqual({ viewportW: 1280, maskH: 287, slantPx: 285, amplitudePx: 12.5 });
    expect(WAVE_SPEC).toEqual({
      slantFracX: WAVE_REFERENCE.slantPx / WAVE_REFERENCE.viewportW,
      ampFracX: WAVE_REFERENCE.amplitudePx / WAVE_REFERENCE.viewportW,
      periods: 8,
      samples: 64
    });
    expect(WAVE_EDGE_PATH).toBe(buildWaveEdgePath(WAVE_SPEC));
  });
});
