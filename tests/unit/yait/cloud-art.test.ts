import { describe, expect, test } from 'vitest';
import { CLOUD_ART } from '../../../src/lib/yait/cloudArt';

describe('CLOUD_ART traced cloud data', () => {
  test('has a positive coordinate space', () => {
    expect(CLOUD_ART.width).toBeGreaterThan(0);
    expect(CLOUD_ART.height).toBeGreaterThan(0);
  });

  test('is three tone layers, back-to-front shadow -> mid -> cream', () => {
    expect(CLOUD_ART.layers.map(l => l.tone)).toEqual(['shadow', 'mid', 'cream']);
  });

  test('every layer is a closed path with at least one subpath', () => {
    for (const layer of CLOUD_ART.layers) {
      expect(layer.d.startsWith('M')).toBe(true);
      expect(layer.d.trimEnd().endsWith('Z')).toBe(true);
      expect((layer.d.match(/M /g) ?? []).length).toBeGreaterThanOrEqual(1);
    }
  });

  test('the outlines are smooth bezier curves, not straight-segment polylines', () => {
    for (const layer of CLOUD_ART.layers) {
      expect((layer.d.match(/C /g) ?? []).length).toBeGreaterThanOrEqual(4);
      expect(layer.d).not.toMatch(/ L /);
    }
  });

  test('is static constant data (deterministic)', () => {
    expect(CLOUD_ART).toEqual(CLOUD_ART);
    expect(CLOUD_ART.layers).toHaveLength(3);
  });
});
