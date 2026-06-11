import { describe, expect, test } from 'vitest';
import {
  buildFryCrowd,
  createSeededRandom,
  staggerDelays,
  BOUNCE_STEP_MS,
  CROWD_SEED,
  FRY_AMPLITUDE_RANGE,
  FRY_COUNT,
  FRY_FACES,
  FRY_HEIGHT_RANGE,
  FRY_HUES,
  LEAN_CYCLE_MS,
  SCENE_TIMELINE
} from '../../../src/lib/yait/heroScene';

describe('createSeededRandom', () => {
  test('same seed yields the same sequence', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  test('different seeds yield different sequences', () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  test('values stay within [0, 1)', () => {
    const rand = createSeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('staggerDelays', () => {
  test('starts at base and increases by step', () => {
    expect(staggerDelays(5, 100, 90)).toEqual([100, 190, 280, 370, 460]);
  });

  test('is strictly increasing for positive steps', () => {
    const delays = staggerDelays(FRY_COUNT, 0, BOUNCE_STEP_MS);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
  });

  test('zero count yields an empty list', () => {
    expect(staggerDelays(0, 100, 90)).toEqual([]);
  });
});

describe('buildFryCrowd', () => {
  test('returns the requested number of fries', () => {
    expect(buildFryCrowd(FRY_COUNT, CROWD_SEED)).toHaveLength(FRY_COUNT);
  });

  test('is deterministic for the same seed', () => {
    expect(buildFryCrowd(FRY_COUNT, CROWD_SEED)).toEqual(buildFryCrowd(FRY_COUNT, CROWD_SEED));
  });

  test('varies across seeds', () => {
    expect(buildFryCrowd(FRY_COUNT, 1)).not.toEqual(buildFryCrowd(FRY_COUNT, 99));
  });

  test('every fry stays within the documented bounds', () => {
    for (const fry of buildFryCrowd(FRY_COUNT, CROWD_SEED)) {
      expect(fry.heightPx).toBeGreaterThanOrEqual(FRY_HEIGHT_RANGE[0]);
      expect(fry.heightPx).toBeLessThanOrEqual(FRY_HEIGHT_RANGE[1]);
      expect(FRY_HUES).toContain(fry.hue);
      expect(FRY_FACES).toContain(fry.face);
      expect(fry.bounceAmplitudePx).toBeGreaterThanOrEqual(FRY_AMPLITUDE_RANGE[0]);
      expect(fry.bounceAmplitudePx).toBeLessThanOrEqual(FRY_AMPLITUDE_RANGE[1]);
      expect(fry.leanDelayMs).toBeLessThanOrEqual(0);
      expect(fry.leanDelayMs).toBeGreaterThan(-LEAN_CYCLE_MS);
    }
  });

  test('bounce delays ripple left to right matching staggerDelays', () => {
    const crowd = buildFryCrowd(FRY_COUNT, CROWD_SEED);
    const expected = staggerDelays(FRY_COUNT, 0, BOUNCE_STEP_MS);
    expect(crowd.map(f => f.bounceDelayMs)).toEqual(expected);
  });

  test('the crowd mixes at least two hues and two heights', () => {
    const crowd = buildFryCrowd(FRY_COUNT, CROWD_SEED);
    expect(new Set(crowd.map(f => f.hue)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(crowd.map(f => f.heightPx)).size).toBeGreaterThanOrEqual(2);
  });
});

describe('SCENE_TIMELINE invariants', () => {
  test('four headline words with strictly increasing reveal starts', () => {
    expect(SCENE_TIMELINE.wordRevealStartsMs).toHaveLength(4);
    for (let i = 1; i < SCENE_TIMELINE.wordRevealStartsMs.length; i++) {
      expect(SCENE_TIMELINE.wordRevealStartsMs[i]).toBeGreaterThan(SCENE_TIMELINE.wordRevealStartsMs[i - 1]);
    }
  });

  test('the last word finishes revealing before the dock settle ends', () => {
    const lastWordEnd =
      SCENE_TIMELINE.wordRevealStartsMs[SCENE_TIMELINE.wordRevealStartsMs.length - 1] +
      SCENE_TIMELINE.wordRevealDurationMs;
    expect(lastWordEnd).toBeLessThanOrEqual(SCENE_TIMELINE.sailDurationMs + SCENE_TIMELINE.dockSettleDurationMs);
  });

  test('the bounce ripple and CTA rise start exactly when docking completes', () => {
    const docked = SCENE_TIMELINE.sailDurationMs + SCENE_TIMELINE.dockSettleDurationMs;
    expect(SCENE_TIMELINE.bounceStartMs).toBe(docked);
    expect(SCENE_TIMELINE.ctaRiseStartMs).toBe(docked);
  });

  test('all durations are positive', () => {
    expect(SCENE_TIMELINE.sailDurationMs).toBeGreaterThan(0);
    expect(SCENE_TIMELINE.wordRevealDurationMs).toBeGreaterThan(0);
    expect(SCENE_TIMELINE.dockSettleDurationMs).toBeGreaterThan(0);
  });
});
