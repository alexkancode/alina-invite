import { describe, expect, test } from 'vitest';
import { buildWaveEdgePath, WAVE_EDGE_PATH, WAVE_REFERENCE } from '../../../src/lib/yait/heroScene';

const SPEC = {
  slantFracX: WAVE_REFERENCE.slantPx / WAVE_REFERENCE.viewportW,
  ampFracX: WAVE_REFERENCE.amplitudePx / WAVE_REFERENCE.viewportW,
  periods: 1,
  samples: 48
};

const wavePoints = (path: string) =>
  [...path.matchAll(/L (-?[\d.]+) (-?[\d.]+)/g)]
    .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
    .filter(p => !(p.x === 0 && (p.y === 0 || p.y === 1)));

describe('buildWaveEdgePath', () => {
  const path = buildWaveEdgePath(SPEC);
  const pts = wavePoints(path);
  const x0 = 1 - SPEC.slantFracX;

  test('is a closed clip region covering the revealed side', () => {
    expect(path.startsWith('M 0 0 ')).toBe(true);
    expect(path.endsWith('L 0 1 Z')).toBe(true);
  });

  test('the wave is anchored exactly on the slant ends', () => {
    expect(pts[0].x).toBeCloseTo(x0, 4);
    expect(pts[0].y).toBe(0);
    expect(pts[pts.length - 1].x).toBeCloseTo(1, 4);
    expect(pts[pts.length - 1].y).toBe(1);
  });

  test('the edge descends monotonically', () => {
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].y).toBeGreaterThan(pts[i - 1].y);
    }
  });

  test('one crest and one trough deviating by the amplitude', () => {
    const deviations = pts.map(p => p.x - (x0 + SPEC.slantFracX * p.y));
    const max = Math.max(...deviations);
    const min = Math.min(...deviations);
    expect(max).toBeCloseTo(SPEC.ampFracX, 3);
    expect(min).toBeCloseTo(-SPEC.ampFracX, 3);
  });

  test('sampling density is high enough to render smooth', () => {
    expect(pts.length).toBeGreaterThanOrEqual(SPEC.samples);
  });
});

describe('WAVE_EDGE_PATH constant', () => {
  test('round-trips through the reference geometry', () => {
    expect(WAVE_REFERENCE).toEqual({ viewportW: 1280, maskH: 287, slantPx: 285, amplitudePx: 50 });
    expect(WAVE_EDGE_PATH).toBe(buildWaveEdgePath(SPEC));
  });
});
