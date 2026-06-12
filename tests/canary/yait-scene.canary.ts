import { describe, expect, test } from 'vitest';
import { buildFryCrowd, CROWD_SEED, FRY_COUNT, FRY_FACES, FRY_HEIGHT_RANGE, HEADLINE_LINES, SCENE_TIMELINE, type FryConfig } from '../../src/lib/yait/heroScene';

const componentBinding = (fry: FryConfig) => ({
  '--fry-h': `${fry.heightPx}px`,
  '--fry-hue': `${fry.hue}`,
  '--fry-amp': `${fry.bounceAmplitudePx}px`,
  '--fry-delay': `${SCENE_TIMELINE.bounceStartMs + fry.bounceDelayMs}ms`,
  '--lean-delay': `${fry.leanDelayMs}ms`,
  'data-face': fry.face
});

describe('yait scene contract canary', () => {
  test('every field HeroBay binds to markup exists with the expected type', () => {
    for (const fry of buildFryCrowd(FRY_COUNT, CROWD_SEED)) {
      expect(Number.isFinite(fry.heightPx)).toBe(true);
      expect(Number.isFinite(fry.hue)).toBe(true);
      expect(Number.isFinite(fry.bounceAmplitudePx)).toBe(true);
      expect(Number.isFinite(fry.bounceDelayMs)).toBe(true);
      expect(Number.isFinite(fry.leanDelayMs)).toBe(true);
      expect(typeof fry.face).toBe('string');
      expect(FRY_FACES).toContain(fry.face);

      const bound = componentBinding(fry);
      expect(bound['--fry-h']).toMatch(/^\d+(\.\d+)?px$/);
      expect(bound['--fry-amp']).toMatch(/^\d+(\.\d+)?px$/);
      expect(bound['--fry-delay']).toMatch(/^\d+(\.\d+)?ms$/);
      expect(bound['--lean-delay']).toMatch(/^-?\d+(\.\d+)?ms$/);
    }
  });

  test('the crowd survives a JSON round trip unchanged (serializable, no hidden state)', () => {
    const crowd = buildFryCrowd(FRY_COUNT, CROWD_SEED);
    expect(JSON.parse(JSON.stringify(crowd))).toEqual(crowd);
  });

  test('the fry crowd stands at its tall stature', () => {
    expect(FRY_HEIGHT_RANGE).toEqual([78, 126]);
  });

  test('the headline lockup is two lines carrying the four words in order', () => {
    expect(HEADLINE_LINES).toHaveLength(2);
    expect(HEADLINE_LINES[0]).toEqual(['You', 'Are']);
    expect(HEADLINE_LINES[1]).toEqual(['Invited', 'To']);
  });

  test('the timeline constants the stylesheet choreography depends on are stable', () => {
    expect(SCENE_TIMELINE).toEqual({
      sailDurationMs: 5000,
      dockSettleDurationMs: 1000,
      bounceStartMs: 6000,
      ctaRiseStartMs: 6000
    });
  });
});
