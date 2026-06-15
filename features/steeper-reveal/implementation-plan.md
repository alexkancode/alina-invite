# steeper-reveal - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- `WHIP_GEOMETRY.slantPx: 300 -> 240`. Everything else unchanged; `WHIP_EDGE_FRAMES`
  regenerate automatically.

## Tests (TDD)

### `tests/unit/yait/whip-edge.test.ts`
- Update the `WHIP_GEOMETRY` equality to `slantPx: 240`; keep `slantPx < maskH`. The
  bump/baseline/flat-end tests are amplitude-based and stay green.

### `tests/integration/home-page.test.ts`
- Unchanged: it checks the served HTML contains `WHIP_EDGE_FRAMES[0].slice(0, 60)`
  (imported, so it tracks the regenerated frames automatically).

### `tests/e2e.yait-home.test.ts`
- The slant-ratio test: a more-vertical edge lowers `slantPx/height`, so relax the lower
  bound (`> 0.6` -> `> 0.45`); keep the upper bound and the single-bump / deviation
  assertions.

## PR checklist pass

- One geometry constant change; no new util, inline styles, comments, or duplication.
  Pinned by unit (slantPx) and e2e (relaxed slant ratio still bounded).

## Validation

- Unit + canary + integration + e2e green. Screenshot the reveal mid-sweep: the diagonal
  edge stands up more vertical. CURL `/home` (whip clip present), `/` (`favoriteSong`),
  `/api/health` 200, `/homex` 404.
