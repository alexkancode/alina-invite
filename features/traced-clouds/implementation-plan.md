# traced-clouds - implementation plan

## Source

### `src/lib/yait/cloudArt.ts` (NEW - static traced data)
- `export interface CloudArtLayer { tone: 'shadow' | 'mid' | 'cream'; d: string }`
- `export interface CloudArt { width: number; height: number; layers: CloudArtLayer[] }`
- `export const CLOUD_ART: CloudArt` with `width: 485, height: 337` and the three
  traced path strings in back-to-front order (shadow, mid, cream). Data is generated
  once from `/tmp/cloud-sample/clouds-traced.svg` (the approved trace) and committed
  verbatim - no runtime tracing. One purpose: hold the cloud geometry.

### `src/components/yait/HeroBay.astro`
- Import `CLOUD_ART`.
- Change `yait-sky-grad` stops to the cyan beach sky (`#34BBD0` -> `#5BC9D6`).
- Add to `<defs>` a `<filter id="yait-cloud-warp">` (feTurbulence fractalNoise +
  feDisplacementMap) with animated `baseFrequency` and `scale` (the approved option C
  warp values).
- After the sun circles (current line 39), render:
  `<g class="clouds" transform="translate(TX TY) scale(S)">` ->
  `<g filter="url(#yait-cloud-warp)">` ->
  `CLOUD_ART.layers.map(l => <path class={`cloud-layer cloud-${l.tone}`} d={l.d}/>)`.
- TX / TY / S are layout constants chosen to fit the 485x337 art across the sky band
  (y 0..420); final values tuned by screenshot during validation.

### `src/styles/yait.css`
- Tone fills (no inline styles): `.cloud-shadow { fill: #A9D9CE }`,
  `.cloud-mid { fill: #CDEAE0 }`, `.cloud-cream { fill: #FBF6E9 }`.
- `.cloud-layer { transform-box: fill-box; transform-origin: 50% 92% }`.
- `.cloud-shadow { animation: swell-flat 12s ... }`, `.cloud-mid { swell-tall 9s -2s }`,
  `.cloud-cream { swell-tall 8s -4s }` (the approved mid-intensity timings/amplitudes).
- `@keyframes swell-tall` and `@keyframes swell-flat` (mid-intensity values from the
  sample).
- Add `.cloud-layer` to the existing `prefers-reduced-motion` group.

## Tests (TDD - write/extend first)

### `tests/unit/yait/cloud-art.test.ts` (NEW)
- Exactly three layers; tones are `['shadow','mid','cream']` in that order
  (back-to-front).
- Every `d` starts with `M`, ends with `Z`, has >= 1 subpath; `width`/`height` > 0.
- Data is a plain constant (deterministic): two reads are equal.

### `tests/canary/sail-keyframes.canary.ts`
- Assert `@keyframes swell-tall` and `swell-flat` exist; `.cloud-cream`/`.cloud-mid`
  use `swell-tall`, `.cloud-shadow` uses `swell-flat`; the three tone fills exist;
  `.cloud-layer` is in the reduced-motion group.
- NEW orphaned-keyframe guard: every `@keyframes NAME` in the CSS is referenced by some
  `animation`/`animation-name` declaration (catches the "defined but never attached"
  bug hit in the sample).

### `tests/integration/home-page.test.ts`
- Replace the "no clouds" guard with: three `class="cloud-layer cloud-...` paths
  present; `id="yait-cloud-warp"` filter present with `<feturbulence`/`feturbulence`
  and an animated `<feDisplacementMap` (an `<animate` inside the filter); sky gradient
  now contains the cyan stop and not the old `#F9C784` amber stop.
- Keep the birthday `/` (`favoriteSong`) and `/api/health` regression guards.

### `tests/e2e.yait-home.test.ts`
- Replace "no clouds render" with: `.cloud-layer` count is 3; under reduced motion the
  layers have no running animation (computed `animation-name: none` or static
  transform); without reduced motion, a layer's bounding box / transform changes across
  a ~2s wait (breathing is live).

## PR checklist pass

- New util/data lives in its own `cloudArt.ts` module, not bolted onto `heroScene.ts`
  (geometry source vs traced asset are distinct concerns).
- Fills and animations are CSS classes, not inline `style=`; the `transform` on the
  cloud group is an SVG presentation attribute, not an inline style.
- No duplicated helpers (no procedural cloud builder returns - this is static data);
  no duplicated style rules (breathing keyframes are new, tone fills are new).
- Interfaces (`CloudArt`, `CloudArtLayer`) make the data testable; each is single
  purpose. No comments added.
- Reduced motion covered at both layers (SMIL strip + CSS rest).

## Validation

- `npx vitest run tests/unit tests/canary` green for yait; rebuild; integration green
  against the local server; `npx playwright test e2e.yait-home.test.ts` green.
- Take down local server, rebuild, redeploy locally.
- CURL `/home` and grep: three `cloud-layer` paths, `yait-cloud-warp` filter with an
  animated displacement map, cyan sky stop present and amber stop gone. CURL `/`
  (`favoriteSong` present) and `/api/health` (200); `/homex` 404.
- Screenshot the hero; compare the sky to the sample for cream/mid/seafoam banding and
  the cloud arrangement; capture two frames to confirm the clouds move. Tune TX/TY/S
  and warp/breathe amplitude if the placement or intensity reads off. To validate
  traced-clouds I can diff two hero screenshots taken ~2s apart and confirm a non-zero
  changed-pixel percentage in the sky band, and confirm it drops to zero under
  emulated reduced motion.
