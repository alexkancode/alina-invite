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

export const REVEAL_STAGGER_PX = 150;
export const REVEAL_DURATION_MS = 6000;

export function revealDelayMs(edge: RevealWaypoint[], staggerPx: number, viewportW: number, durationMs: number): number {
  const sweepPx = (-edge[0].percent / 100) * viewportW;
  return Math.round((durationMs * staggerPx) / sweepPx);
}

export const REVEAL_TOP_DELAY_MS = revealDelayMs(REVEAL_EDGE, REVEAL_STAGGER_PX, 1280, REVEAL_DURATION_MS);

export interface WaveGeometry {
  viewportW: number;
  maskH: number;
  slantPx: number;
  amplitudePx: number;
  periods: number;
  samples: number;
}

export const WAVE_GEOMETRY: WaveGeometry = {
  viewportW: 1280,
  maskH: 185,
  slantPx: 185,
  amplitudePx: 12.5,
  periods: 5,
  samples: 40
};

const frac = (n: number) => Math.round(n * 100000) / 100000;

export function buildWaveEdgePath(g: WaveGeometry): string {
  const edgeLen = Math.hypot(g.slantPx, g.maskH);
  const normal = { x: -g.maskH / edgeLen, y: g.slantPx / edgeLen };
  const omega = 2 * Math.PI * g.periods;
  const x0Px = g.viewportW - g.slantPx;
  const pointAt = (s: number) => ({
    x: (x0Px + g.slantPx * s + g.amplitudePx * Math.sin(omega * s) * normal.x) / g.viewportW,
    y: (g.maskH * s + g.amplitudePx * Math.sin(omega * s) * normal.y) / g.maskH
  });
  const tangentAt = (s: number) => ({
    x: (g.slantPx + g.amplitudePx * omega * Math.cos(omega * s) * normal.x) / g.viewportW,
    y: (g.maskH + g.amplitudePx * omega * Math.cos(omega * s) * normal.y) / g.maskH
  });
  const ds = 1 / g.samples;
  const cubics = Array.from({ length: g.samples }, (_, i) => {
    const s0 = i * ds;
    const s1 = (i + 1) * ds;
    const p0 = pointAt(s0);
    const p1 = pointAt(s1);
    const d0 = tangentAt(s0);
    const d1 = tangentAt(s1);
    const c1 = { x: p0.x + (ds / 3) * d0.x, y: p0.y + (ds / 3) * d0.y };
    const c2 = { x: p1.x - (ds / 3) * d1.x, y: p1.y - (ds / 3) * d1.y };
    return `C ${frac(c1.x)} ${frac(c1.y)} ${frac(c2.x)} ${frac(c2.y)} ${frac(p1.x)} ${frac(p1.y)}`;
  });
  return `M 0 0 L ${frac(x0Px / g.viewportW)} 0 ${cubics.join(' ')} L 0 1 Z`;
}

export const WAVE_EDGE_PATH: string = buildWaveEdgePath(WAVE_GEOMETRY);

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
export const FRY_HEIGHT_RANGE = [78, 126] as const;
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
