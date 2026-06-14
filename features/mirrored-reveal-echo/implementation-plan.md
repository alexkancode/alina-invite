# mirrored-reveal-echo - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Extract a private helper `whipEdgeParts(g, center)` returning `{ head, tail, cubics }`
  (the cubic strings + anchor points) from the current `buildWhipEdgePath` body.
- `buildWhipEdgePath` calls it and produces the SAME string as today (closed clip):
  `M -0.5 -0.5 L head.x -0.5 L head.x head.y <cubics> L tail.x 1.5 L -0.5 1.5 Z`.
- Add `export function buildWhipEdgeLine(g, center)` -> `M head.x head.y <cubics>` (open).
- Add `export const WHIP_LINE_FRAMES` = same centers as `WHIP_EDGE_FRAMES`, mapped
  through `buildWhipEdgeLine`.

### `src/components/yait/HeroBay.astro`
- Import `WHIP_LINE_FRAMES` (and existing `revealSweep`).
- Inside `.headline-mask`, after `.reveal-window`, add:
  `<svg class="reveal-echo" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">`
  `<g transform="translate(0 1) scale(1 -1)">`
  `<path class="reveal-echo-line" d={WHIP_LINE_FRAMES[0]}>` with
  `<animate attributeName="d" values={WHIP_LINE_FRAMES.join(';')} dur="3.333s" repeatCount="indefinite"/>`
  and the reveal `translate` sweep (`revealSweep` values/keyTimes/keySplines, 5.333s, fill freeze, spline).

### `src/styles/yait.css`
- `.reveal-echo { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }`
- `.reveal-echo-line { fill: none; stroke: #ffffff; stroke-opacity: 0.45; stroke-width: 5px; vector-effect: non-scaling-stroke; }`

## Tests (TDD)

### `tests/unit/yait/whip-edge.test.ts`
- `buildWhipEdgePath` output unchanged (existing tests stay green - guards the refactor).
- New: `buildWhipEdgeLine` starts with `M`, contains `C` cubics, has no ` L ` box edges
  and no `Z` (open line); `WHIP_LINE_FRAMES` length equals `WHIP_EDGE_FRAMES` length.

### `tests/canary/sail-keyframes.canary.ts`
- `.reveal-echo-line` has `fill: none`, `stroke: #ffffff` (or `#fff`), `stroke-opacity: 0.45`,
  `stroke-width: 5px`, `vector-effect: non-scaling-stroke`.

### `tests/integration/home-page.test.ts`
- Served HTML has `class="reveal-echo"`, `class="reveal-echo-line"`, the
  `translate(0 1) scale(1 -1)` flip, an `<animate attributeName="d"` morph and a
  `type="translate"` sweep inside the echo; the echo path has `fill="none"`-equivalent
  (CSS) and reveals nothing (no clip-path on it).

### `tests/e2e.yait-home.test.ts`
- The `.reveal-echo-line` exists, computed `stroke` is white and `stroke-opacity` ~0.45,
  `fill` is none; under reduced motion it has no running SMIL (animations stripped).

## PR checklist pass

- Shared `whipEdgeParts` avoids duplicating the edge math; `buildWhipEdgePath` stays
  byte-identical (guarded by existing tests). Stroke styling is CSS (no inline styles),
  one purpose each. The echo reuses `REVEAL_EDGE`/`WHIP` (no new constants duplicated).

## Validation

- `npx vitest run tests/unit tests/canary` green (incl. unchanged whip path); rebuild;
  integration green; e2e green.
- CURL `/home`: reveal-echo svg + line + flip transform + morph/sweep animates; reveal
  unchanged. `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
- Screenshot the headline band mid-reveal: a ~5px ~45% white wavy line mirrored across
  the horizontal axis travels in sync with the reveal edge and reveals nothing.
