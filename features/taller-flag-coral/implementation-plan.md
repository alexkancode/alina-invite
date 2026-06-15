# taller-flag-coral - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
- Flag pole: `<line x1="32" y1="38" x2="32" y2="10" ...>` -> `y2="-55"`.
- Pennant: `d="M32 10 L2 18 L32 26 Z"` -> `d="M32 -55 L2 -47 L32 -39 Z"` (same size, at the
  new mast top).

### `src/styles/yait.css`
- `.envelope-art`: add `overflow: visible;` so the taller mast (above the viewBox top) is
  not clipped.
- `.headline`: `color: var(--yait-ink)` -> `color: var(--yait-coral)`. `text-shadow` kept.

## Tests (TDD)

### `tests/integration/home-page.test.ts`
- Served HTML has the pennant `d="M32 -55 L2 -47 L32 -39 Z"` and pole `y2="-55"`, and no
  longer the old `M32 10 L2 18` / `y2="10"` for the flag line.

### `tests/canary/sail-keyframes.canary.ts`
- `.headline` block contains `color: var(--yait-coral);`; `.envelope-art` block contains
  `overflow: visible;`.

### `tests/e2e.yait-home.test.ts`
- The headline computed colour is `rgb(231, 111, 81)` (coral).

## PR checklist pass

- Static path edits + two CSS property changes; no inline styles, comments, or
  duplication. Pinned by integration (flag geometry), canary (colour + overflow), e2e
  (computed colour).

## Validation

- Integration + canary + e2e green. Screenshot the boat (flag flies ~100px higher, not
  clipped) and the revealed headline (coral). CURL `/home` (flag path), `/`
  (`favoriteSong`), `/api/health` 200, `/homex` 404.
