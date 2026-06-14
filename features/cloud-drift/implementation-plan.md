# cloud-drift - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
- Wrap each layer path in a drift group:
  `<g class={`cloud-drift cloud-drift-${l.tone}`}><path class={`cloud-layer cloud-${l.tone}`} .../></g>`
  inside the existing `<g filter="url(#yait-cloud-warp)">`.
- Widen the warp filter region: `x="-10%" y="-6%" width="120%" height="112%"` so the
  drifting layers do not clip.

### `src/styles/yait.css`
- `.cloud-drift-shadow { animation: drift-shadow 60s ease-in-out infinite alternate; }`
- `.cloud-drift-mid    { animation: drift-mid 60s ease-in-out infinite alternate; }`
- `.cloud-drift-cream  { animation: drift-cream 60s ease-in-out infinite alternate; }`
- `@keyframes drift-shadow { from { transform: translateX(0) } to { transform: translateX(8px) } }`
- `@keyframes drift-mid    { from { transform: translateX(0) } to { transform: translateX(12px) } }`
- `@keyframes drift-cream  { from { transform: translateX(0) } to { transform: translateX(16px) } }`
- Add `.cloud-drift` to the existing `prefers-reduced-motion` `animation: none` group.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- `@keyframes drift-shadow`/`drift-mid`/`drift-cream` exist; the three `.cloud-drift-*`
  rules reference them; `.cloud-drift` is in the reduced-motion group.
- Parallax ordering: the cream drift `translateX` peak > mid > shadow (parse the px
  from each keyframe). Pins "whitest leads".
- The existing orphaned-keyframe guard automatically covers the new keyframes.

### `tests/integration/home-page.test.ts`
- The served HTML contains three `class="cloud-drift cloud-drift-` groups, each
  wrapping its `cloud-layer` path.

### `tests/e2e.yait-home.test.ts`
- Extend the cloud test: the cream drift group's computed `translateX` exceeds the
  shadow group's at a sampled mid-cycle time (parallax is live), and a drift group's
  translate changes across a wait (drifting). Reduced-motion test: `.cloud-drift`
  animation-name is none.

## PR checklist pass

- Drift wrappers are the minimal structural change needed because one element cannot
  run two `transform` animations; this is composition, not duplication.
- Amplitudes live in CSS keyframes (no inline styles); reduced motion gated; no
  comments; single concern (horizontal drift). The parallax ordering is pinned by a
  canary test (testable contract) rather than asserted as a brittle exact pixel.

## Validation

- `npx vitest run tests/unit tests/canary` green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy.
- CURL `/home`: three `cloud-drift` groups, drift keyframes present, three cloud layers
  + warp + cyan sky intact; `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
- Sample computed `translateX` of the three drift groups: cream > mid > shadow with
  ~5px / ~10px on-screen gaps; confirm it changes over time and rests under reduced
  motion. Screenshot two frames ~several seconds apart to confirm a slow rightward
  shift with shapes intact.
