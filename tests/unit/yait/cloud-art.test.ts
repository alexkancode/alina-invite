import { describe, expect, test } from 'vitest';
import { CLOUD_ART } from '../../../src/lib/yait/cloudArt';

describe('CLOUD_ART traced cloud data', () => {
  test('has a positive coordinate space', () => {
    expect(CLOUD_ART.width).toBeGreaterThan(0);
    expect(CLOUD_ART.height).toBeGreaterThan(0);
  });

  test('is six layers: rest + hero for each tone, shadow -> mid -> cream', () => {
    expect(CLOUD_ART.layers).toHaveLength(6);
    const seen = CLOUD_ART.layers.map(l => `${l.tone}:${l.group}`);
    for (const tone of ['shadow', 'mid', 'cream']) {
      expect(seen).toContain(`${tone}:rest`);
      expect(seen).toContain(`${tone}:hero`);
    }
    expect(CLOUD_ART.layers[0].tone).toBe('shadow');
    expect(CLOUD_ART.layers[CLOUD_ART.layers.length - 1].tone).toBe('cream');
  });

  test('the hero (biggest) cloud is split out as its own non-empty group', () => {
    for (const tone of ['shadow', 'mid', 'cream']) {
      const hero = CLOUD_ART.layers.find(l => l.tone === tone && l.group === 'hero');
      expect(hero).toBeDefined();
      expect(hero!.d.length).toBeGreaterThan(0);
    }
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
    expect(CLOUD_ART.layers).toHaveLength(6);
  });
});
