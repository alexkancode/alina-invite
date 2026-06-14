# natural-cloud-shapes - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Change `CloudShape` to `{ d: string; points: { x: number; y: number }[] }`.
- Rework `buildCloud(spec)`:
  1. `createSeededRandom(spec.seed)`; width = base * scale; corners at (xL, baseY) and
     (xR, baseY).
  2. Build perimeter points left-to-right: bottom-left corner, then per lobe a valley
     (between lobes) and an unequal peak. Peak height uses a sine envelope (taller in
     the middle) times seeded jitter; valley depth jittered. Bottom-right corner.
  3. Smooth the points into cubic beziers via Catmull-Rom (control points
     `p1 +/- (p2 - p0)/6`), giving a C1 organic top.
  4. Return `d = "M <bl> <cubics...> L <bl> Z"` (smooth lumpy top + flat bottom) and
     the perimeter `points` (for tests).
- `CLOUDS` and `buildCloud`'s signature (CloudSpec) unchanged.

### `src/components/yait/HeroBay.astro`
- Replace the per-cloud `<rect>` base + `{ellipses.map(<ellipse>)}` with a single
  `<path d={shape.d} fill="url(#yait-cloud-grad)">`. The hero rim-glow ellipse and the
  `.cloud` / `.cloud-inner` group structure stay.

## Tests

- `tests/unit/yait/clouds.test.ts`: rewrite the `buildCloud` shape tests for the path
  output: `d` starts with `M` and ends with `Z` and contains cubic `C` segments; the
  bottom corners (`points[0]`, `points[last]`) sit at `baseY` (flat base); several
  interior points rise above the baseline (lumps) and their heights are not all equal
  (irregular); deterministic for a seed, varies across seeds; larger scale -> taller
  max rise. The `CLOUDS` layout tests are unchanged.
- `tests/integration/home-page.test.ts`: still passes (cloud groups + `cloud-grad`
  fills + `cloud-glow` present; pills gone). Add a check that the cloud body is now a
  `<path ... fill="url(#yait-cloud-grad)"` (no per-cloud `<rect>` base).
- `tests/canary/sail-keyframes.canary.ts`, `tests/e2e.yait-home.test.ts`: unaffected
  (motion/keyframes and `.cloud` count unchanged); re-run.

## PR checklist pass

- One generator reworked beside the others, reusing `createSeededRandom`; Catmull-Rom
  smoothing is a local helper with one purpose. No inline styles, no duplication, no
  comments. The interface change is contained to `buildCloud` consumers (markup +
  unit test).

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms each cloud body is a `<path>` with the cloud
  gradient and no per-cloud `<rect>`; 404 and `/api/health` 200.
- Screenshot the sky and confirm clouds read as single soft irregular puffs (not rows
  of balls). To validate natural-cloud-shapes I can compare the new sky capture to the
  prior ellipse-stack one and confirm the silhouettes are smoother and more organic;
  tune lobe count / peak / valley if any cloud looks too lumpy or too round.
