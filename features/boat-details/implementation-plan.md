# boat-details - implementation plan

## Source

### `src/styles/yait.css`
- Add `@keyframes wake-pivot` = the `pivot` keyframes with negated angles
  (`rotateY(-20deg)` at 25% and 68.75%, 0 elsewhere).
- `.reveal-echo` animation list: replace `pivot` with `wake-pivot` (keep `wake-fade`,
  `transform-origin: 100% 50%`).

### `src/components/yait/HeroBay.astro`
- Flag (envelope-art): `<line x1="14" ... x2="14" ...>` -> `x1="32" x2="32"`;
  `<path d="M14 10 L44 18 L14 26 Z" ...>` -> `d="M32 10 L2 18 L32 26 Z"`.
- Back flap (envelope-flap): `<path d="M 12 90 L 100 8 L 188 90 Z" ...>` ->
  `d="M 4 90 L 100 8 L 196 90 Z"`.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- `@keyframes wake-pivot` exists with `rotateY(-20deg)`; `.reveal-echo` runs `wake-pivot`
  (not `pivot`). The orphan-keyframe guard still passes (both pivot and wake-pivot
  referenced).

### `tests/integration/home-page.test.ts`
- The served HTML contains the left-pointing flag path `M32 10 L2 18 L32 26 Z` and the
  flush flap path `M 4 90 L 100 8 L 196 90 Z` (and no longer the old `M14 10 L44 18` /
  `M 12 90 L 100 8 L 188 90`).

### `tests/e2e.yait-home.test.ts`
- Update the wake-swivel assertion: `.reveal-echo` runs `wake-pivot`. Add: at the 25%
  beat the wake's rotateY is opposite the boat's (matrix3d m13 of `.reveal-echo` and
  `.envelope-pivot` have opposite signs).

## PR checklist pass

- One new keyframe (negated), reuses the structure; flag/flap are static path edits; no
  inline styles, comments, or duplicated rules. Pinned by canary (keyframe + ref),
  integration (paths), e2e (opposite swivel).

## Validation

- Canary + integration + e2e green. Screenshot the boat: flag points left, flap flush to
  the sides, wake swivels counter to the boat at the beats. CURL `/home` (flag/flap paths,
  echo present), `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
