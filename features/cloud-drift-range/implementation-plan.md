# cloud-drift-range - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
- Move the warp filter from the single wrapping `<g filter>` onto each per-layer drift
  group: `<g class={`cloud-drift cloud-drift-${l.tone}`} filter="url(#yait-cloud-warp)">`.
  Remove the now-empty wrapping group.
- Return the filter region to `x="-6%" y="-6%" width="112%" height="112%"` (drift is
  applied after the filter now, so the wide region is no longer needed).

### `src/styles/yait.css`
- `@keyframes drift-shadow` to `translateX(160px)`, `drift-mid` to `translateX(164px)`,
  `drift-cream` to `translateX(168px)` (peaks; ~200/205/210px on screen).
- Durations: 60s -> 80s on all three `.cloud-drift-*` rules. Still `ease-in-out`
  `alternate`. Phases/transform-origin unchanged.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- The existing parallax-ordering test still holds (160 < 164 < 168, cream leads).
- Add a minimum-range assertion: the drift-shadow peak `translateX` is >= 120px (guards
  against silently regressing back to an imperceptible range).

### `tests/integration/home-page.test.ts`
- The three `cloud-drift` groups now each carry `filter="url(#yait-cloud-warp)"`; assert
  the filter appears on the drift groups (filter usage count for the cloud warp is 3).

### `tests/e2e.yait-home.test.ts`
- Rewrite the parallax test to seek deterministically: set each drift group's Web
  Animation `currentTime` to the 80s peak, then read `translateX` (m41) and assert
  cream > mid > shadow with the values near 168 / 164 / 160. Keep the "drifts over
  time" and reduced-motion-rest checks.

## PR checklist pass

- Filter-per-layer is the minimal structural change that makes a large drift possible
  without clipping; no new util, no inline styles, no duplicated rules, no comments.
- Single concern (drift range + the attachment point it requires). Parallax ordering
  and a minimum range are pinned by canary; the live values are pinned by a
  deterministic seek in e2e (no flaky timing dependence).

## Validation

- `npx vitest run tests/unit tests/canary` green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy.
- Seek-and-read the three drift `translateX` at peak: ~160 / 164 / 168 user units;
  confirm change over time and reduced-motion rest.
- Screenshot two frames a few seconds apart; confirm a clearly perceptible rightward
  drift, shapes intact. CURL `/home` (three drift groups w/ warp filter, layers, cyan
  sky), `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
