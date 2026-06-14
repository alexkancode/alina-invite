# sunset-clouds - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- `interface CloudShape { ellipses: {cx,cy,rx,ry}[]; base: {x,y,width,height} }`
- `interface CloudSpec { cx,baseY,scale,seed }`
- `buildCloud(spec): CloudShape` - reuses `createSeededRandom`. Emits 4 bottom-aligned
  ellipses (`cy = baseY - ry`) with jittered radii/x-offsets (no two equal) forming a
  puffy mass, plus a flat base rect spanning the width at `baseY`. One purpose: build
  one cloud's shape; deterministic from seed.
- `interface CloudLayout { id; spec; opacity; glow }` and `CLOUDS: CloudLayout[]` -
  one hero (near the sun, `glow: true`) + three smaller, fainter far clouds clustered
  around but not over the sun (940,140). Positions in viewBox units.

### `src/components/yait/HeroBay.astro`
- Add `<linearGradient id="yait-cloud-grad" gradientUnits="userSpaceOnUse" x1=0 y1=60
  x2=0 y2=260>` with stops `#FBE3BC / #F4A259 / #E76F51` (so clouds shade by height,
  consistent under horizontal drift).
- Replace the three `<rect>` pills with `CLOUDS.map`: each a
  `<g class="cloud cloud--{id}"><g class="cloud-inner cloud-inner--{id}">` containing
  (for the hero) a faint amber rim-glow ellipse behind, then the `buildCloud` ellipses
  + base rect, all `fill="url(#yait-cloud-grad)"`, group `opacity`. No inline styles
  (timing lives in CSS classes; geometry lives in the generated coords).

### `src/styles/yait.css`
- `.cloud { animation: cloud-drift var per class }`, `.cloud-inner { animation:
  cloud-bob ..., cloud-breathe ... }`. Keyframes:
  - `cloud-drift`: `translateX` from offscreen-left to offscreen-right (e.g. -240 ->
    1440 in viewBox px), `linear infinite`.
  - `cloud-bob`: `translateY(0 -> -8px -> 0)`, `ease-in-out infinite`.
  - `cloud-breathe`: `opacity` mild (0.9 <-> 1) `ease-in-out infinite`.
- Per-cloud `.cloud--1..4` / `.cloud-inner--1..4`: incommensurate durations + negative
  delays (drift 90/130/170/210s; bob 17/19/21/23s; breathe 11/13/9/15s) so clouds
  start on-screen and never resync. Far clouds slower (depth).
- Reduced motion: add `.cloud, .cloud-inner` to the existing `animation: none` group;
  with no drift the clouds rest at their authored (on-screen) positions.

## Tests (TDD)

- `tests/unit/yait/clouds.test.ts` (new): `buildCloud` returns >= 4 ellipses; every
  ellipse is bottom-aligned (`cy + ry` ~= baseY) so the bottom is flat; radii are not
  all equal (jittered); deterministic for a seed, varies across seeds; base rect spans
  the cloud and sits at baseY. `CLOUDS` has one `glow` hero + several far clouds, all
  in the sky band (`baseY < 300`), none centred on the sun.
- `tests/canary/sail-keyframes.canary.ts`: assert `cloud-drift` / `cloud-bob` /
  `cloud-breathe` keyframes exist (translateX / translateY / opacity) and that
  `.cloud` and `.cloud-inner` are in the reduced-motion group.
- `tests/integration/home-page.test.ts`: served HTML has `id="yait-cloud-grad"`, the
  three old pill rects are gone, and the cloud groups (`class="cloud`) are present;
  no `<rect ... rx="13"` pill remains.
- `tests/e2e.yait-home.test.ts`: a cloud's computed transform changes across a short
  real-time wait (drift), and under reduced motion the clouds are on-screen
  (bounding rect within the viewport) and their transform is static.

## PR checklist pass

- `buildCloud` is a pure generator beside the other scene builders; reuses
  `createSeededRandom` (no duplication). One gradient in defs (no per-cloud gradient
  dup). No inline styles (timing in CSS classes). Single purpose per function/keyframe.
  No comments. Unit + canary + integration + e2e cover shape, markup, motion, a11y.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `yait-cloud-grad`, cloud groups, and the old
  pills gone; 404 and `/api/health` 200.
- Screenshot the sky: puffy two-tone clouds around the sun, rim-glow on the hero, no
  pills. To validate sunset-clouds I can capture two frames a second apart and confirm
  a cloud has drifted, and a reduced-motion capture shows them nicely placed and still.

## Sources

Shape/colour: CSS-Tricks (Three Ways to Blob; Drawing Clouds - what to avoid),
Smashing (SVG arc/curve commands), fffuel cccloud, Art in Context / media.io (sunset
palettes), EchoUser (depth in flat design), Kreafolk / CLIP STUDIO (cloud illustration
depth). Motion: David Ball (optimising cloud CSS - translateX over margin), Smashing
(infinite-scroll logos; GPU animation), CSS-Tricks (prefers-reduced-motion; SMIL),
Handoff.design (staggered animations), MDN / web.dev (reduced motion, perf).
