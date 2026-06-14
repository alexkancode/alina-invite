import { describe, expect, test } from 'vitest';
import { buildCloud, CLOUDS } from '../../../src/lib/yait/heroScene';

const spec = { cx: 760, baseY: 130, scale: 1, seed: 7 };

describe('buildCloud', () => {
  const cloud = buildCloud(spec);

  test('is a puffy stack of at least four ellipses on a flat base', () => {
    expect(cloud.ellipses.length).toBeGreaterThanOrEqual(4);
  });

  test('every ellipse is bottom-aligned so the cloud has a flat bottom', () => {
    for (const e of cloud.ellipses) {
      expect(Math.abs(e.cy + e.ry - spec.baseY)).toBeLessThan(1.5);
    }
  });

  test('the base rect closes the flat bottom across the cloud width', () => {
    expect(cloud.base.y + cloud.base.height).toBeCloseTo(spec.baseY, 0);
    expect(cloud.base.width).toBeGreaterThan(0);
  });

  test('the bumps are jittered (not all the same radius)', () => {
    const radii = new Set(cloud.ellipses.map(e => Math.round(e.rx)));
    expect(radii.size).toBeGreaterThan(1);
  });

  test('is deterministic for a seed and varies across seeds', () => {
    expect(buildCloud(spec)).toEqual(buildCloud(spec));
    expect(buildCloud(spec)).not.toEqual(buildCloud({ ...spec, seed: 99 }));
  });

  test('scale grows the cloud', () => {
    const big = buildCloud({ ...spec, scale: 1.6 });
    const span = (c: typeof cloud) => Math.max(...c.ellipses.map(e => e.rx));
    expect(span(big)).toBeGreaterThan(span(cloud));
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
