import { describe, expect, test } from 'vitest';
import { buildCloud, CLOUDS } from '../../../src/lib/yait/heroScene';

const spec = { cx: 760, baseY: 130, scale: 1, seed: 7 };

describe('buildCloud', () => {
  const cloud = buildCloud(spec);
  const rise = (c: typeof cloud) => Math.max(...c.points.map(p => spec.baseY - p.y));

  test('is one closed smooth bezier path (lumpy top over a flat base)', () => {
    expect(cloud.d.startsWith('M ')).toBe(true);
    expect(cloud.d.endsWith('Z')).toBe(true);
    expect((cloud.d.match(/C /g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  test('the bottom corners sit on the flat baseline', () => {
    expect(cloud.points[0].y).toBe(spec.baseY);
    expect(cloud.points[cloud.points.length - 1].y).toBe(spec.baseY);
  });

  test('the top rises into several lumps above the baseline', () => {
    const lumps = cloud.points.filter(p => spec.baseY - p.y > 5);
    expect(lumps.length).toBeGreaterThanOrEqual(3);
    expect(rise(cloud)).toBeGreaterThan(20);
  });

  test('the lumps are irregular (peak heights vary)', () => {
    const peaks = new Set(cloud.points.map(p => Math.round(spec.baseY - p.y)).filter(h => h > 5));
    expect(peaks.size).toBeGreaterThan(1);
  });

  test('is deterministic for a seed and varies across seeds', () => {
    expect(buildCloud(spec)).toEqual(buildCloud(spec));
    expect(buildCloud(spec)).not.toEqual(buildCloud({ ...spec, seed: 99 }));
  });

  test('scale grows the cloud', () => {
    expect(rise(buildCloud({ ...spec, scale: 1.6 }))).toBeGreaterThan(rise(cloud));
  });
});

describe('CLOUDS layout', () => {
  test('has one rim-lit hero cloud and several far clouds', () => {
    expect(CLOUDS.length).toBeGreaterThanOrEqual(4);
    expect(CLOUDS.filter(c => c.glow)).toHaveLength(1);
  });

  test('every cloud sits in the sky band', () => {
    for (const c of CLOUDS) {
      expect(c.spec.baseY).toBeGreaterThan(40);
      expect(c.spec.baseY).toBeLessThan(300);
      expect(c.opacity).toBeGreaterThan(0);
      expect(c.opacity).toBeLessThanOrEqual(1);
    }
  });

  test('far clouds are fainter than the hero', () => {
    const hero = CLOUDS.find(c => c.glow)!;
    const far = CLOUDS.filter(c => !c.glow);
    for (const c of far) {
      expect(c.opacity).toBeLessThanOrEqual(hero.opacity);
    }
  });

  test('there is a receding parallax plane of small, faint clouds', () => {
    const receding = CLOUDS.filter(c => c.opacity <= 0.4 && !c.glow);
    expect(receding.length).toBeGreaterThanOrEqual(2);
    for (const c of receding) {
      expect(c.spec.scale).toBeLessThan(0.6);
    }
  });
});
