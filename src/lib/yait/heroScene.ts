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

export interface TrackWaypoint {
  offset: number;
  xVw: number;
}

export interface WeaveWaypoint {
  offset: number;
  yPx: number;
  rotateDeg: number;
  scale: number;
}

export const SAIL_TRACK: TrackWaypoint[] = [
  { offset: 0, xVw: -92 },
  { offset: 0.4, xVw: -52 },
  { offset: 0.75, xVw: -16 },
  { offset: 1, xVw: 0 }
];

export const SAIL_WEAVE: WeaveWaypoint[] = [
  { offset: 0, yPx: -14, rotateDeg: 2, scale: 0.96 },
  { offset: 0.4, yPx: 22, rotateDeg: 3, scale: 1.04 },
  { offset: 0.75, yPx: -10, rotateDeg: -2.5, scale: 0.97 },
  { offset: 1, yPx: 0, rotateDeg: 0, scale: 1 }
];

export interface RevealWaypoint {
  offset: number;
  percent: number;
}

export interface HullGeometry {
  leftPercent: number;
  lockVw: number;
}

export const ENVELOPE_LEFT_PERCENT = 61;
export const ENVELOPE_WIDTH_VW = 24;
export const ENVELOPE_LEFT_PERCENT_MOBILE = 46;
export const ENVELOPE_WIDTH_VW_MOBILE = 52;
export const REVEAL_LOCK_VW = 0;
export const REVEAL_SAIL_SHARE = 5 / 6;

export function buildRevealEdge(track: TrackWaypoint[], hull: HullGeometry): RevealWaypoint[] {
  const sailing = track.map(wp => ({
    offset: Math.round(wp.offset * REVEAL_SAIL_SHARE * 10000) / 10000,
    percent: wp.xVw + hull.leftPercent + hull.lockVw - 100
  }));
  return [...sailing, { offset: 1, percent: 0 }];
}

export const REVEAL_EDGE: RevealWaypoint[] = buildRevealEdge(SAIL_TRACK, {
  leftPercent: ENVELOPE_LEFT_PERCENT,
  lockVw: REVEAL_LOCK_VW
});

export const REVEAL_EDGE_MOBILE: RevealWaypoint[] = buildRevealEdge(SAIL_TRACK, {
  leftPercent: ENVELOPE_LEFT_PERCENT_MOBILE,
  lockVw: REVEAL_LOCK_VW
});

export interface WaveEdgeSpec {
  slantFracX: number;
  ampFracX: number;
  periods: number;
  samples: number;
}

export const WAVE_REFERENCE = { viewportW: 1280, maskH: 287, slantPx: 285, amplitudePx: 50 };

const frac = (n: number) => Math.round(n * 100000) / 100000;

export function buildWaveEdgePath(spec: WaveEdgeSpec): string {
  const x0 = 1 - spec.slantFracX;
  const wave = Array.from({ length: spec.samples + 1 }, (_, i) => {
    const t = i / spec.samples;
    const x = x0 + spec.slantFracX * t + spec.ampFracX * Math.sin(2 * Math.PI * spec.periods * t);
    return `L ${frac(x)} ${frac(t)}`;
  });
  return `M 0 0 ${wave.join(' ')} L 0 1 Z`;
}

export const WAVE_EDGE_PATH: string = buildWaveEdgePath({
  slantFracX: WAVE_REFERENCE.slantPx / WAVE_REFERENCE.viewportW,
  ampFracX: WAVE_REFERENCE.amplitudePx / WAVE_REFERENCE.viewportW,
  periods: 1,
  samples: 48
});

export interface SceneTimeline {
  sailDurationMs: number;
  dockSettleDurationMs: number;
  bounceStartMs: number;
  ctaRiseStartMs: number;
}

export const HEADLINE_LINES: string[][] = [
  ['You', 'Are'],
  ['Invited', 'To']
];

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
