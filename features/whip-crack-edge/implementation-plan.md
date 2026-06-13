# whip-crack-edge - implementation plan

## Mechanism

Replace the sine clip path + translate roll with a straight-slant-plus-Gaussian-bump
clip path whose `d` is morphed through a seamless ping-pong of frames by a SMIL
`<animate>`. Baseline points are identical across frames so only the bump moves; the
revealed text never shifts.

## `src/lib/yait/heroScene.ts`

Remove `WaveGeometry`, `WAVE_GEOMETRY`, `buildWaveEdgePath`, `WAVE_EDGE_PATH`,
`WAVE_ROLL_PERIOD_MS`, `WAVE_ROLL` (dead once whip lands). Add:

```ts
export interface WhipGeometry {
  viewportW: number; maskH: number; slantPx: number;
  amplitudePx: number; widthFrac: number; samples: number;
}
export const WHIP_GEOMETRY: WhipGeometry = {
  viewportW: 1280, maskH: 185, slantPx: 185,
  amplitudePx: 34, widthFrac: 0.09, samples: 28
};
export const WHIP_CENTER_MIN = 0.18;
export const WHIP_CENTER_MAX = 0.82;
export const WHIP_HALF_FRAMES = 8;       // frames each direction; total 2*half+1, seamless
export const WHIP_DURATION_MS = 1400;    // full down-and-back cycle

export function buildWhipEdgePath(g: WhipGeometry, center: number): string { ... }
export function whipCenters(min: number, max: number, half: number): number[] { ... } // ping-pong, c[0]==c[last]
export const WHIP_EDGE_FRAMES: string[] = whipCenters(...).map(c => buildWhipEdgePath(WHIP_GEOMETRY, c));
export const WHIP = { durationMs: WHIP_DURATION_MS };
```

`buildWhipEdgePath`: same Hermite->Bezier sampling style as the old generator, but the
perpendicular offset is a Gaussian `amp * exp(-((s-center)/w)^2)` (with derivative
`-2*amp*(s-center)/w^2 * exp(...)` for tangents), `w = widthFrac`. Sample `s` in
`[0,1]` (no periodic margins; ends are straight because the bump centers stay inside
`[0.18,0.82]`). Same enclosure `M -0.5 -0.5 ... Z`. Identical cubic count for every
center so frames morph cleanly.

`whipCenters`: returns `2*half+1` centers ramping min->max then max->min (triangle),
so the SMIL loop is seamless (`c[0] === c[last]`).

## `src/components/yait/HeroBay.astro`

Swap the import to the whip exports. Replace the `<animateTransform>` translate with:

```astro
<path d={WHIP_EDGE_FRAMES[0]}>
  <animate attributeName="d"
    values={WHIP_EDGE_FRAMES.join(';')}
    dur={`${WHIP.durationMs / 1000}s`}
    repeatCount="indefinite"></animate>
</path>
```

## `src/pages/home.astro`

Reduced-motion inline script removes `animate` as well as `animateTransform`:
`document.querySelectorAll('animate, animateTransform').forEach(el => el.remove())`.

## `src/styles/yait.css`

No change (clip-path url, docked reveal keyframes, reduced-motion block all stay).

## Tests (failure-first)

- `tests/unit/yait/wave-edge.test.ts` -> rewrite as whip-edge unit tests:
  - `WHIP_GEOMETRY` shape; 45-degree (`slantPx === maskH`).
  - `buildWhipEdgePath`: closed region with the standard enclosure; a straight
    baseline away from the bump (deviation ~0 at s far from center); a single bump of
    height ~`amplitudePx` near `center` (exactly one deviation peak, unlike the sine's
    many); ends effectively flat (|offset| at s=0,1 < ~1px for centers in range).
  - All frames share an identical cubic count (morph-safe), and `WHIP_EDGE_FRAMES[0]
    === WHIP_EDGE_FRAMES[last]` (seamless loop).
  - `whipCenters` is a triangle ping-pong with min/max endpoints.
  - `WHIP.durationMs === 1400`.
- `tests/integration/home-page.test.ts`:
  - "ships the generated wave clip": assert `WHIP_EDGE_FRAMES[0].slice(0,60)` present.
  - SMIL: `<animate`, `attributeName="d"`, `repeatCount="indefinite"`, `dur="1.4s"`;
    NOT `animateTransform` / NOT `fill="freeze"`.
  - reduced-motion: the inline script targets `animate`.
- `tests/canary/sail-keyframes.canary.ts`: unaffected (reveal keyframes + clip-path
  url only). Re-run to confirm.
- `tests/e2e.yait-home.test.ts`:
  - Replace the "wavy 45-degree slant with a bold swoop" probe with a whip probe:
    slant ratio still ~1 (45 degrees); exactly one deviation lobe of height ~`amp`
    (re-measure bounds live).
  - "wave rolls perceptibly" (during reveal) and "keeps traveling at rest" burst
    tests stay structurally but re-measured: a morphing bump changes edge pixels over
    time. Re-measure floors.
  - reduced-motion: assert the morph node count is 0 after the script
    (`page.locator('animate')`).
  - Keep "intro animates transform and opacity only" - the `d` morph is on an SVG
    attribute, not a CSS animated property, so the WAAPI keyframe check is unaffected
    (verify it still passes; SMIL is not in getAnimations()).

## PR checklist pass

- No dead code: the sine generator/constants are removed, not left orphaned.
- Single purpose: `buildWhipEdgePath` builds one frame; `whipCenters` builds the
  ping-pong schedule; `WHIP` holds timing. Geometry constants beside the generator.
- No inline styles, no CSS duplication (CSS untouched).
- Testability: pure functions returning strings/arrays, unit-testable without a DOM.
- No comments.
- Tests: unit (geometry, single-bump, morph-safety, seamless), integration (markup
  attrs + reduced-motion target), e2e (single lobe, motion during reveal and at rest,
  reduced-motion removal).

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `<animate attributeName="d"`, `dur="1.4s"`,
  `repeatCount="indefinite"`, no `animateTransform`; 404 and `/api/health` 200.
- Capture the reveal sequence and the docked edge; confirm a single bump travels down,
  reflects, and returns, and that revealed letters do not bob. To validate
  whip-crack-edge I can step frames across one cycle and check the bump's lobe moves
  monotonically down then back while a fully-revealed word stays byte-stable.
