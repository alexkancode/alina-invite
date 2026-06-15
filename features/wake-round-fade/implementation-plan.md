# wake-round-fade - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- In `wakeTail`, change the far-end cap arc sweep flag from `1` to `0`
  (`A ${maxHalf} ${maxHalf} 0 0 0 ...`) so it bulges convex outward. Stern cap unchanged.

### `src/styles/yait.css`
- `@keyframes wake-fade { from { opacity: 1 } to { opacity: 0 } }`.
- `.reveal-echo`: add `animation: wake-fade 1.2s 5.333s linear forwards;` (holds during
  the sail, fades after docking).
- Reduced-motion block: add a `.reveal-echo { opacity: 0; }` rule (parked scene, no wake)
  and include `.reveal-echo` in the `animation: none` group.

## Tests (TDD)

### `tests/unit/yait/whip-edge.test.ts`
- `buildWakeTails` far caps use the outward sweep: the `maxHalf` arc reads
  `A 15 15 0 0 0` (two of them, one per tail); still two subpaths, four arcs total.

### `tests/canary/sail-keyframes.canary.ts`
- `@keyframes wake-fade` exists; `.reveal-echo` references `wake-fade` with `5.333s`
  delay and `forwards`; reduced-motion sets `.reveal-echo` opacity `0`. The orphan guard
  still passes.

### `tests/e2e.yait-home.test.ts`
- Extend the wake test: computed `opacity` of `.reveal-echo` is ~1 at mid-sail (2000ms)
  and ~0 after docking + fade (e.g. 7000ms).

## PR checklist pass

- One-character geometry change + a small CSS keyframe/rule; no inline styles, comments,
  or duplication. The fade reuses the existing dock timing (5.333s). Pinned by unit
  (cap sweep), canary (keyframe + delay + reduced motion), e2e (opacity over time).

## Validation

- Unit + canary + integration + e2e green. Screenshot mid-sail (far ends bulge outward,
  wake visible) and post-dock (wake faded to nothing). CURL `/home` (echo present), `/`
  (`favoriteSong`), `/api/health` 200, `/homex` 404.
