# tapered-wake - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- `WakeGeometry` interface + `WAKE_GEOMETRY` const
  (`width, height, maxHalf, minHalf, amplitude, samples, frames`).
- `buildWakeRibbon(g, phase)`: sine centerline `y(x) = height/2 + amplitude*sin(2pi*x/width + phase)`;
  `half(x) = minHalf + (maxHalf-minHalf)*(1 - x/width)` (maxHalf at the far/left end x=0,
  minHalf at the stern/right end x=width). Build top edge stern->far, far semicircular cap
  (`A maxHalf...`), bottom edge far->stern, small stern cap (`A minHalf...`), `Z`.
- `WAKE_FRAMES = Array(frames).map(i => buildWakeRibbon(WAKE_GEOMETRY, 2pi*i/frames))`.

### `src/components/yait/HeroBay.astro`
- Replace the whip-line echo path with `<path class="reveal-echo-line" d={WAKE_FRAMES[0]}>`
  + `<animate attributeName="d" values={WAKE_FRAMES.join(';')} dur=... repeatCount="indefinite">`.
  Drop the `WHIP_LINE_FRAMES` usage and the mirror-flip group (the ribbon is built in final
  orientation). `viewBox` set to include the cap margins (e.g. `-maxHalf 0 width+maxHalf height`),
  `preserveAspectRatio="none"` with a matching-aspect box so thickness is undistorted.

### `src/styles/yait.css`
- `.reveal-echo-line`: `fill: #ffffff; fill-opacity: 0.45;` (remove stroke / vector-effect /
  fill:none).
- `.reveal-echo`: size in px to the ribbon (`width`/`height` matching the viewBox aspect),
  anchored at the stern (`right: 100%`) at the waterline (`bottom` tuned). Remove the
  percentage width/left from longer-wake.

## Tests (TDD)

### `tests/unit/yait/whip-edge.test.ts` (or a new wake test)
- `buildWakeRibbon` starts `M`, ends `Z`, contains `A` (rounded caps), is deterministic per
  phase; `WAKE_FRAMES` length == `WAKE_GEOMETRY.frames`; differs across phases.

### `tests/canary/sail-keyframes.canary.ts`
- `.reveal-echo-line` has `fill: #ffffff` and `fill-opacity: 0.45` and no `stroke-width`.

### `tests/integration/home-page.test.ts`
- The echo path `d` contains an arc command (`A`) (ribbon caps) and the echo still sits
  inside the envelope, reveals nothing (no clip-path), keeps the `<animate attributeName="d">`.

### `tests/e2e.yait-home.test.ts`
- The wake's rendered bounding-box height is now substantial (e.g. `> 24px`, reflecting the
  ~30px far end), still pinned at the boat's left (stern) with no page scroll.

## PR checklist pass

- New `buildWakeRibbon` is one pure function beside the other geometry builders (reuses the
  `frac`/round idiom); no inline styles, no comments, no duplication. Fill vs stroke is a CSS
  rule. Pinned by unit (geometry), canary (CSS), integration (markup), e2e (size + pin).

## Validation

- Unit + canary green; rebuild; integration + e2e green. Screenshot mid-sail and docked:
  wake widens toward the far end with rounded ends, thin at the stern, riding the boat.
  CURL `/home` (reveal-echo present), `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
  Tune `maxHalf` / anchor / viewBox margins by screenshot.
