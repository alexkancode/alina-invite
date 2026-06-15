# twin-wake - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Rename `buildWakeRibbon` -> `buildWakeTails(g, phase)`; add `splay` to `WakeGeometry`
  and `WAKE_GEOMETRY`, and grow `height` to fit the V.
- Internal `tail(g, phase, dir)` builds one closed tapered subpath whose centerline is
  `height/2 + dir*splay*(1 - x/width) + amplitude*sin(2pi*x/width + phase)` (dir -1 upper,
  +1 lower), half-thickness `minHalf..maxHalf`, with the two semicircular caps.
  `buildWakeTails` returns `tail(-1) + ' ' + tail(+1)` (two subpaths).
- `WAKE_FRAMES` maps `buildWakeTails`.

### `src/components/yait/HeroBay.astro`
- `wakeViewBox` recomputed from the new geometry (taller). No markup change beyond the
  viewBox value (still one `<path>` fed by `WAKE_FRAMES`).

### `src/styles/yait.css`
- `.reveal-echo` height grows to match the new viewBox aspect; `bottom` re-tuned so the V
  centers on the waterline. Fill / `right: 100%` anchor unchanged.

## Tests (TDD)

### `tests/unit/yait/whip-edge.test.ts`
- Update the wake tests to `buildWakeTails`: two closed subpaths (`M` count 2), four arc
  caps (`A` count 4), taper (maxHalf*2 == 30), deterministic per phase, varies across
  phases, `WAKE_FRAMES` length.

### `tests/canary/sail-keyframes.canary.ts`
- Unchanged echo fill + stern-anchor assertions still hold.

### `tests/integration/home-page.test.ts`
- The echo path `d` has two subpaths (two `M`) and arc caps, inside the envelope, no
  clip-path, keeps `<animate attributeName="d">`.

### `tests/e2e.yait-home.test.ts`
- The wake bounding-box height is now taller (the V spread) and still pinned at the
  stern with no scroll; width still long.

## PR checklist pass

- One generator (renamed, single purpose), reuses the cap/taper idiom; no inline styles,
  comments, or duplication. Pinned by unit (geometry), canary (CSS), integration
  (markup), e2e (size + pin).

## Validation

- Unit + canary + integration + e2e green. Screenshot mid-sail/docked: two trapezoidal
  tails fan into a V behind the stern, rounded far ends, thin at the boat, riding the
  sail. CURL `/home` (echo present, two subpaths), `/` (`favoriteSong`), `/api/health`
  200, `/homex` 404. Tune `splay`/anchor by screenshot.
