# longer-wake - implementation plan

## Source

### `src/styles/yait.css`
- `.reveal-echo`: `left: -98% -> -294%` and `width: 98% -> 294%` (right edge stays at
  the stern; wave stretches ~3x leftward). `bottom`/`height` unchanged.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- The `.reveal-echo` rule contains `width: 294%` (and stays `position: absolute`, no
  `translateY`).

### `tests/e2e.yait-home.test.ts`
- Extend the boat-wake test: the wake line width is now substantially larger (e.g.
  `> 150px`, was ~70px) while its right edge still tracks the boat's left (stern) and
  the page has no scroll.

## PR checklist pass

- One CSS rule edit, single purpose, no inline styles/comments/duplication. Pinned by
  canary (CSS) + e2e (width + stern pin + no scroll).

## Validation

- Canary green; rebuild; e2e green. Screenshot mid-sail: longer trailing wake, still at
  the stern. CURL `/home` (reveal-echo present), `/` (`favoriteSong`), `/api/health`
  200, `/homex` 404.
