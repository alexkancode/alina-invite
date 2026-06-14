# cloud-drift-linear - implementation plan

## Source

### `src/styles/yait.css`
- `.cloud-drift-shadow` / `.cloud-drift-mid` / `.cloud-drift-cream`: change the timing
  function from `ease-in-out` to `linear`. Everything else (80s, `infinite`,
  `alternate`, the keyframes) unchanged.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- Assert the three `.cloud-drift-*` rules use `linear` (and no longer `ease-in-out`),
  pinning constant velocity.

### `tests/e2e.yait-home.test.ts`
- Add a linearity guard: seek `.cloud-drift-shadow` to `currentTime` = 20000 (25% of
  80s) and assert `translateX` is near the linear prediction 40px (within ~8px). Under
  the old ease-in-out it would read ~23px, so this fails on regression. Keep the
  existing peak parallax and reduced-motion tests.

## PR checklist pass

- One-line-per-rule timing change in the file that owns the animations; no new util, no
  inline styles, no duplicated rules, no comments. Single concern (timing function).
  The fix is pinned by a canary (CSS contract) and a deterministic e2e seek (behavioural
  contract) so the exact bug cannot silently return.

## Validation

- `npx vitest run tests/unit tests/canary` green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy.
- Seek `.cloud-drift-shadow` to currentTime 20000 and confirm translateX ~40px (linear),
  not ~23px (ease). Sample real-time translateX over the first 8s and confirm steady
  increments. Screenshot t=2s and t=10s and confirm a visible rightward shift.
- CURL `/home` (drift groups + warp + layers + cyan sky), `/` (`favoriteSong`),
  `/api/health` 200, `/homex` 404.
