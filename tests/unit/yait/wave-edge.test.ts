import { describe, expect, test } from 'vitest';
import { buildWaveEdgePath, WAVE_EDGE_PATH, WAVE_REFERENCE, WAVE_SPEC } from '../../../src/lib/yait/heroScene';

const wavePoints = (path: string) =>
  [...path.matchAll(/L (-?[\d.]+) (-?[\d.]+)/g)]
    .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
    .filter(p => !(p.x === 0 && (p.y === 0 || p.y === 1)));

describe('buildWaveEdgePath', () => {
  const path = buildWaveEdgePath(WAVE_SPEC);
  const pts = wavePoints(path);
  const x0 = 1 - WAVE_SPEC.slantFracX;
  const deviations = pts.map(p => p.x - (x0 + WAVE_SPEC.slantFracX * p.y));

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

  test('crests and troughs deviate by the amplitude', () => {
    expect(Math.max(...deviations)).toBeCloseTo(WAVE_SPEC.ampFracX, 3);
    expect(Math.min(...deviations)).toBeCloseTo(-WAVE_SPEC.ampFracX, 3);
  });

  test('two periods produce two crests and two troughs', () => {
    const extrema = [];
    for (let i = 1; i < deviations.length - 1; i++) {
      const rising = deviations[i] - deviations[i - 1] > 0;
      const falling = deviations[i + 1] - deviations[i] < 0;
      if (rising === falling) extrema.push(deviations[i] > 0 ? 'crest' : 'trough');
    }
    expect(extrema.filter(e => e === 'crest')).toHaveLength(WAVE_SPEC.periods);
    expect(extrema.filter(e => e === 'trough')).toHaveLength(WAVE_SPEC.periods);
  });

  test('sampling density is high enough to render smooth', () => {
    expect(pts.length).toBeGreaterThanOrEqual(WAVE_SPEC.samples);
    expect(WAVE_SPEC.samples / WAVE_SPEC.periods).toBeGreaterThanOrEqual(24);
  });
});

describe('WAVE_EDGE_PATH constant', () => {
  test('round-trips through the reference geometry', () => {
    expect(WAVE_REFERENCE).toEqual({ viewportW: 1280, maskH: 287, slantPx: 285, amplitudePx: 25 });
    expect(WAVE_SPEC).toEqual({
      slantFracX: WAVE_REFERENCE.slantPx / WAVE_REFERENCE.viewportW,
      ampFracX: WAVE_REFERENCE.amplitudePx / WAVE_REFERENCE.viewportW,
      periods: 8,
      samples: 256
    });
    expect(WAVE_EDGE_PATH).toBe(buildWaveEdgePath(WAVE_SPEC));
  });
});
