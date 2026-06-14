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
  { offset: 0.25, xVw: -52 },
  { offset: 0.6875, xVw: -16 },
  { offset: 1, xVw: 0 }
];

export const SAIL_WEAVE: WeaveWaypoint[] = [
  { offset: 0, yPx: -14, rotateDeg: 2, scale: 0.96 },
  { offset: 0.25, yPx: 22, rotateDeg: 3, scale: 1.04 },
  { offset: 0.6875, yPx: -10, rotateDeg: -2.5, scale: 0.97 },
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
export const REVEAL_REST_PERCENT = -15;

export function buildRevealEdge(track: TrackWaypoint[], hull: HullGeometry, restPercent: number): RevealWaypoint[] {
  const sailing = track.map(wp => ({
    offset: Math.round(wp.offset * REVEAL_SAIL_SHARE * 10000) / 10000,
    percent: wp.xVw + hull.leftPercent + hull.lockVw - 100
  }));
  return [...sailing, { offset: 1, percent: restPercent }];
}

export const REVEAL_EDGE: RevealWaypoint[] = buildRevealEdge(SAIL_TRACK, {
  leftPercent: ENVELOPE_LEFT_PERCENT,
  lockVw: REVEAL_LOCK_VW
}, REVEAL_REST_PERCENT);

export const REVEAL_EDGE_MOBILE: RevealWaypoint[] = buildRevealEdge(SAIL_TRACK, {
  leftPercent: ENVELOPE_LEFT_PERCENT_MOBILE,
  lockVw: REVEAL_LOCK_VW
}, REVEAL_REST_PERCENT);

export const REVEAL_DURATION_MS = 5333;

export interface WhipGeometry {
  viewportW: number;
  maskH: number;
  slantPx: number;
  amplitudePx: number;
  widthFrac: number;
  samples: number;
}

export const WHIP_GEOMETRY: WhipGeometry = {
  viewportW: 1280,
  maskH: 370,
  slantPx: 300,
  amplitudePx: 50,
  widthFrac: 0.16667,
  samples: 28
};

export const WHIP_CENTER_MIN = 0;
export const WHIP_CENTER_MAX = 1;
export const WHIP_HALF_FRAMES = 12;
export const WHIP_DURATION_MS = 3333;

const frac = (n: number) => Math.round(n * 100000) / 100000;

export function buildWhipEdgePath(g: WhipGeometry, center: number): string {
  const edgeLen = Math.hypot(g.slantPx, g.maskH);
  const normal = { x: -g.maskH / edgeLen, y: g.slantPx / edgeLen };
  const x0Px = g.viewportW - g.slantPx;
  const gaussian = (s: number) => Math.exp(-(((s - center) / g.widthFrac) ** 2));
  const offset = (s: number) => g.amplitudePx * Math.sin(Math.PI * s) * gaussian(s);
  const offsetD = (s: number) =>
    g.amplitudePx * gaussian(s) * (Math.PI * Math.cos(Math.PI * s) - (2 * Math.sin(Math.PI * s) * (s - center)) / (g.widthFrac * g.widthFrac));
  const pointAt = (s: number) => ({
    x: (x0Px + g.slantPx * s + offset(s) * normal.x) / g.viewportW,
    y: (g.maskH * s + offset(s) * normal.y) / g.maskH
  });
  const tangentAt = (s: number) => ({
    x: (g.slantPx + offsetD(s) * normal.x) / g.viewportW,
    y: (g.maskH + offsetD(s) * normal.y) / g.maskH
  });
  const segs = g.samples;
  const ds = 1 / segs;
  const cubics = Array.from({ length: segs }, (_, i) => {
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
  const head = pointAt(0);
  const tail = pointAt(1);
  return `M -0.5 -0.5 L ${frac(head.x)} -0.5 L ${frac(head.x)} ${frac(head.y)} ${cubics.join(' ')} L ${frac(tail.x)} 1.5 L -0.5 1.5 Z`;
}

export function whipCenters(min: number, max: number, half: number): number[] {
  return Array.from({ length: 2 * half + 1 }, (_, i) => {
    const phase = i / half;
    const tri = phase <= 1 ? phase : 2 - phase;
    return Math.round((min + (max - min) * tri) * 100000) / 100000;
  });
}

export const WHIP_EDGE_FRAMES: string[] = whipCenters(WHIP_CENTER_MIN, WHIP_CENTER_MAX, WHIP_HALF_FRAMES)
  .map(c => buildWhipEdgePath(WHIP_GEOMETRY, c));

export const WHIP = { durationMs: WHIP_DURATION_MS };

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

const SAIL_MS = 4444;
const SETTLE_MS = 889;

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

export interface CloudShape {
  d: string;
  points: { x: number; y: number }[];
}

export interface CloudSpec {
  cx: number;
  baseY: number;
  scale: number;
  seed: number;
}

export interface CloudLayout {
  id: number;
  spec: CloudSpec;
  opacity: number;
  glow: boolean;
}

const CLOUD_LOBES = 4;
const CLOUD_HALF_WIDTH = 100;
const CLOUD_PEAK = 56;

export function buildCloud(spec: CloudSpec): CloudShape {
  const rand = createSeededRandom(spec.seed);
  const round = (n: number) => Math.round(n * 100) / 100;
  const halfW = CLOUD_HALF_WIDTH * spec.scale;
  const xL = spec.cx - halfW;
  const xR = spec.cx + halfW;
  const points: { x: number; y: number }[] = [{ x: round(xL), y: spec.baseY }];
  for (let i = 0; i < CLOUD_LOBES; i++) {
    const t = (i + 1) / (CLOUD_LOBES + 1);
    if (i > 0) {
      const vx = xL + 2 * halfW * (t - 0.5 / (CLOUD_LOBES + 1));
      const envelope = Math.sin(Math.PI * (t - 0.5 / (CLOUD_LOBES + 1)));
      const vy = spec.baseY - CLOUD_PEAK * spec.scale * envelope * (0.5 + rand() * 0.12);
      points.push({ x: round(vx), y: round(vy) });
    }
    const envelope = Math.sin(Math.PI * t);
    const peakX = xL + 2 * halfW * t + (rand() - 0.5) * 12 * spec.scale;
    const peakY = spec.baseY - CLOUD_PEAK * spec.scale * envelope * (0.82 + rand() * 0.32);
    points.push({ x: round(peakX), y: round(peakY) });
  }
  points.push({ x: round(xR), y: spec.baseY });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];
    const c1x = round(p1.x + (p2.x - p0.x) / 6);
    const c1y = round(p1.y + (p2.y - p0.y) / 6);
    const c2x = round(p2.x - (p3.x - p1.x) / 6);
    const c2y = round(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  d += ` L ${points[0].x} ${points[0].y} Z`;
  return { d, points };
}

export const CLOUDS: CloudLayout[] = [
  { id: 1, spec: { cx: 740, baseY: 150, scale: 1.05, seed: 41 }, opacity: 0.95, glow: true },
  { id: 2, spec: { cx: 250, baseY: 120, scale: 0.7, seed: 12 }, opacity: 0.6, glow: false },
  { id: 3, spec: { cx: 470, baseY: 96, scale: 0.55, seed: 88 }, opacity: 0.5, glow: false },
  { id: 4, spec: { cx: 1040, baseY: 185, scale: 0.65, seed: 23 }, opacity: 0.55, glow: false },
  { id: 5, spec: { cx: 880, baseY: 78, scale: 0.42, seed: 57 }, opacity: 0.34, glow: false },
  { id: 6, spec: { cx: 350, baseY: 84, scale: 0.46, seed: 9 }, opacity: 0.32, glow: false }
];
