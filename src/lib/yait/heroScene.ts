export const FRY_FACES = ['smile', 'open', 'flat'] as const;
export type FryFace = (typeof FRY_FACES)[number];

export interface FryConfig {
  heightPx: number;
  hue: number;
  face: FryFace;
  bounceDelayMs: number;
  bounceAmplitudePx: number;
  leanDelayMs: number;
}

export interface SceneTimeline {
  sailDurationMs: number;
  wordRevealStartsMs: number[];
  wordRevealDurationMs: number;
  dockSettleDurationMs: number;
  bounceStartMs: number;
  ctaRiseStartMs: number;
}

export const FRY_COUNT = 9;
export const CROWD_SEED = 1977;
export const FRY_HEIGHT_RANGE = [52, 84] as const;
export const FRY_HUES = [14, 28, 172] as const;
export const FRY_AMPLITUDE_RANGE = [8, 16] as const;
export const BOUNCE_STEP_MS = 90;
export const LEAN_CYCLE_MS = 4000;

const SAIL_MS = 5000;
const SETTLE_MS = 1000;

export const SCENE_TIMELINE: SceneTimeline = {
  sailDurationMs: SAIL_MS,
  wordRevealStartsMs: [1000, 2000, 3000, 4000],
  wordRevealDurationMs: 1000,
  dockSettleDurationMs: SETTLE_MS,
  bounceStartMs: SAIL_MS + SETTLE_MS,
  ctaRiseStartMs: SAIL_MS + SETTLE_MS
};

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function staggerDelays(count: number, baseMs: number, stepMs: number): number[] {
  return Array.from({ length: count }, (_, i) => baseMs + i * stepMs);
}

function pickWithin(rand: () => number, [min, max]: readonly [number, number]): number {
  return min + Math.round(rand() * (max - min));
}

export function buildFryCrowd(count: number, seed: number): FryConfig[] {
  const rand = createSeededRandom(seed);
  const bounceDelays = staggerDelays(count, 0, BOUNCE_STEP_MS);
  return bounceDelays.map(bounceDelayMs => ({
    heightPx: pickWithin(rand, FRY_HEIGHT_RANGE),
    hue: FRY_HUES[Math.floor(rand() * FRY_HUES.length)],
    face: FRY_FACES[Math.floor(rand() * FRY_FACES.length)],
    bounceDelayMs,
    bounceAmplitudePx: pickWithin(rand, FRY_AMPLITUDE_RANGE),
    leanDelayMs: -Math.round(rand() * (LEAN_CYCLE_MS - 1))
  }));
}
