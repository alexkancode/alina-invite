# wake-gradient - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
- Inside the `.reveal-echo` svg, add `<defs><linearGradient id="yait-wake-grad"
  gradientUnits="userSpaceOnUse" x1="210" y1="40" x2="0" y2="40"><stop offset="0"
  stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff"
  stop-opacity="0.45"/></linearGradient></defs>` before the path. (x1 = stern = wake
  width; x2 = far origin.)

### `src/styles/yait.css`
- `.reveal-echo-line`: `fill: url(#yait-wake-grad);` and remove `fill-opacity: 0.45`
  (opacity now in the gradient stops).

## Tests (TDD)

### `tests/integration/home-page.test.ts`
- The wake svg contains `id="yait-wake-grad"` with `stop-opacity="0"` and
  `stop-opacity="0.45"`.

### `tests/canary/sail-keyframes.canary.ts`
- `.reveal-echo-line` fill is `url(#yait-wake-grad)`; it no longer sets a flat
  `fill-opacity`.

### `tests/e2e.yait-home.test.ts`
- Update the wake-fill test: computed `fill` of `.reveal-echo-line` is a gradient
  reference (contains `url`), still no clip-path.

## PR checklist pass

- One gradient def + a CSS fill swap; no inline styles (the gradient is markup, fill is a
  rule), no comments, no duplication. Pinned by integration (gradient stops), canary
  (fill url), e2e (computed gradient fill).

## Validation

- Integration + canary + e2e green. Screenshot the wake mid-sail and confirm it fades
  from invisible at the boat to ~0.45 at the far end. CURL `/home` (gradient present),
  `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
