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
  slantPx: 240,
  amplitudePx: 50,
  widthFrac: 0.16667,
  samples: 28
};

export const WHIP_CENTER_MIN = 0;
export const WHIP_CENTER_MAX = 1;
export const WHIP_HALF_FRAMES = 12;
export const WHIP_DURATION_MS = 3333;

const frac = (n: number) => Math.round(n * 100000) / 100000;

function whipEdgeParts(g: WhipGeometry, center: number): { head: { x: number; y: number }; tail: { x: number; y: number }; cubics: string[] } {
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
  return { head: pointAt(0), tail: pointAt(1), cubics };
}

export function buildWhipEdgePath(g: WhipGeometry, center: number): string {
  const { head, tail, cubics } = whipEdgeParts(g, center);
  return `M -0.5 -0.5 L ${frac(head.x)} -0.5 L ${frac(head.x)} ${frac(head.y)} ${cubics.join(' ')} L ${frac(tail.x)} 1.5 L -0.5 1.5 Z`;
}

export function buildWhipEdgeLine(g: WhipGeometry, center: number): string {
  const { head, cubics } = whipEdgeParts(g, center);
  return `M ${frac(head.x)} ${frac(head.y)} ${cubics.join(' ')}`;
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

export const WHIP_LINE_FRAMES: string[] = whipCenters(WHIP_CENTER_MIN, WHIP_CENTER_MAX, WHIP_HALF_FRAMES)
  .map(c => buildWhipEdgeLine(WHIP_GEOMETRY, c));

export const WHIP = { durationMs: WHIP_DURATION_MS };

export interface WakeGeometry {
  width: number;
  height: number;
  maxHalf: number;
  minHalf: number;
  amplitude: number;
  splay: number;
  bottomExtra: number;
  samples: number;
  frames: number;
}

export const WAKE_GEOMETRY: WakeGeometry = {
  width: 210,
  height: 80,
  maxHalf: 15,
  minHalf: 2,
  amplitude: 3,
  splay: 22,
  bottomExtra: 20,
  samples: 20,
  frames: 16
};

function wakeTail(g: WakeGeometry, phase: number, dir: number, length: number): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  const t = (x: number) => (g.width - x) / length;
  const yc = (x: number) => g.height / 2 + dir * g.splay * t(x) + g.amplitude * Math.sin(2 * Math.PI * t(x) + phase);
  const half = (x: number) => g.minHalf + (g.maxHalf - g.minHalf) * t(x);
  const top = Array.from({ length: g.samples + 1 }, (_, i) => {
    const x = g.width - (i / g.samples) * length;
    return [x, yc(x) - half(x)] as const;
  });
  const bottom = Array.from({ length: g.samples + 1 }, (_, i) => {
    const x = g.width - length + (i / g.samples) * length;
    return [x, yc(x) + half(x)] as const;
  });
  let d = `M ${r(top[0][0])} ${r(top[0][1])}`;
  for (let i = 1; i < top.length; i++) d += ` L ${r(top[i][0])} ${r(top[i][1])}`;
  d += ` A ${g.maxHalf} ${g.maxHalf} 0 0 0 ${r(bottom[0][0])} ${r(bottom[0][1])}`;
  for (let i = 1; i < bottom.length; i++) d += ` L ${r(bottom[i][0])} ${r(bottom[i][1])}`;
  d += ` A ${g.minHalf} ${g.minHalf} 0 0 1 ${r(top[0][0])} ${r(top[0][1])}`;
  return d + ' Z';
}

export function buildWakeTails(g: WakeGeometry, phase: number): string {
  return `${wakeTail(g, phase, -1, g.width)} ${wakeTail(g, phase, 1, g.width + g.bottomExtra)}`;
}

export const WAKE_FRAMES: string[] = Array.from({ length: WAKE_GEOMETRY.frames }, (_, i) =>
  buildWakeTails(WAKE_GEOMETRY, (2 * Math.PI * i) / WAKE_GEOMETRY.frames)
);

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
