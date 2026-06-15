# wake-swivel - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Add `bottomExtra: 20` to `WakeGeometry` / `WAKE_GEOMETRY`.
- `wakeTail(g, phase, dir, length)`: stern fixed at `x = g.width`, far end at
  `x = g.width - length`; normalize `t = (g.width - x) / length` (0 stern, 1 far) for the
  taper (`minHalf..maxHalf`), splay (`dir*splay*t`), and wiggle (`sin(2pi*t + phase)`).
  Far cap sweep `0` (outward), stern cap sweep `1`.
- `buildWakeTails(g, phase) = wakeTail(g,phase,-1,g.width) + ' ' + wakeTail(g,phase,1,g.width + g.bottomExtra)`.

### `src/components/yait/HeroBay.astro`
- `wakeViewBox`: `minX = -(WAKE_GEOMETRY.bottomExtra + WAKE_GEOMETRY.maxHalf)`,
  `width = WAKE_GEOMETRY.width + WAKE_GEOMETRY.maxHalf + WAKE_GEOMETRY.bottomExtra`,
  height unchanged. (Stern stays at the viewBox right edge.)

### `src/styles/yait.css`
- `.reveal-echo`: grow `width` to the new viewBox width; add the existing `pivot`
  animation to the list (`animation: wake-fade ..., pivot 4.444s ease-in-out both;`);
  `transform-origin: 100% 50%` (hinge at the stern). Reduced-motion already sets
  `.reveal-echo` `animation: none` + `opacity: 0`.

## Tests (TDD)

### `tests/unit/yait/whip-edge.test.ts`
- `buildWakeTails`: still two subpaths, four arcs, two outward far caps; AND the path now
  contains a negative far x (the lower tail extends past 0), confirming it is longer.
  `WAKE_GEOMETRY.bottomExtra === 20`.

### `tests/canary/sail-keyframes.canary.ts`
- `.reveal-echo` animation list includes `pivot 4.444s ease-in-out both`; has
  `transform-origin: 100% 50%`. The orphan-keyframe guard still passes (pivot referenced).

### `tests/e2e.yait-home.test.ts`
- Extend the wake test: `.reveal-echo` has a running animation named `pivot` (the same
  one the envelope runs, so synced). Keep the existing stern-pin / fade / no-scroll.

## PR checklist pass

- One generator parameter added (length), reuses the existing `pivot` keyframes (no new
  keyframe, no duplication); CSS-only swivel + origin. Pinned by unit (geometry), canary
  (animation + origin), e2e (synced pivot present).

## Validation

- Unit + canary + integration + e2e green. Screenshot mid-beat: lower tail visibly longer,
  wake swivels on Y in sync with the boat, hinged at the stern; post-dock still fades.
  CURL `/home` (echo present, two subpaths), `/` (`favoriteSong`), `/api/health` 200,
  `/homex` 404.
