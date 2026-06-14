# static-headline-text - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Keep `REVEAL_EDGE` (now consumed by HeroBay for the clip sweep) and `REVEAL_DURATION_MS`.
- Remove `REVEAL_EDGE_MOBILE` (becomes unused; the sweep is desktop-only now).

### `src/components/yait/HeroBay.astro`
- Build a `revealSweep` from `REVEAL_EDGE` in frontmatter:
  - `values` = `REVEAL_EDGE.map(wp => `${wp.percent / 100} 0`).join('; ')`
  - `keyTimes` = `REVEAL_EDGE.map(wp => wp.offset).join('; ')`
  - `keySplines` = one per segment, all `0 0 1 1` except the last `0.61 1 0.88 1`
  - `dur` = `${REVEAL_DURATION_MS / 1000}s`
- On the clip `<path>`, add `<animateTransform type="translate" additive="sum" ... fill="freeze" calcMode="spline">` with those, and set the existing rotate `animateTransform` to `additive="sum"` so translate + rotate compose. The `d` morph stays.

### `src/styles/yait.css`
- `.headline`: remove `animation: reveal-text 5.333s linear both;` (text static).
- `.reveal-window`: remove `animation: reveal-mask 5.333s linear both;` keep `clip-path` + `overflow`.
- Remove `@keyframes reveal-mask`, `reveal-text`, `reveal-mask-mobile`, `reveal-text-mobile`.
- Remove the mobile media-query `animation-name: reveal-*-mobile` swaps on `.reveal-window` / `.headline`.
- Leave `.reveal-window`, `.headline` in the reduced-motion group (harmless; no-op now).

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- Remove the `revealPairs` `test.each` blocks and the reveal-mask/reveal-text assertions in "layers flow linearly" and "one reveal window clips" (those keyframes are gone).
- New assertions: `.headline` block has no `animation:`; `.reveal-window` has `clip-path: url(#yait-wave-clip)` and no `animation:`; `@keyframes reveal-mask`/`reveal-text` are absent. Orphan-keyframe guard still passes.
- Fix the dock-ease count: it now excludes the 4 removed reveal keyframes (assert the remaining sail-x/sail-weave ease-out count, and drop the reveal-mask 83.33% check).
- Drop the now-unused `REVEAL_EDGE` / `REVEAL_EDGE_MOBILE` imports.

### `tests/integration/home-page.test.ts`
- Assert the clip path carries `<animateTransform type="translate"` whose `values` start at the `REVEAL_EDGE[0]` percent/100 (e.g. `-1.31 0`) and end at `-0.15 0`, and that the rotate animateTransform is still present.

### `tests/e2e.yait-home.test.ts`
- New: `getComputedStyle('.headline').animationName === 'none'` (text element unanimated).
- New: pin at 1500ms and 4500ms; the `.word` glyph screenshot is byte-identical (text never moves during the reveal).
- Replace the pixel "reveal edge sits at the stern" test: the reveal front is no longer the window's right edge. Assert instead that the clip `translate` animateTransform `values`/`keyTimes` match `REVEAL_EDGE` (tracks the stern by construction). Keep the morph/slant, single-window, byte-stable, cut-line-rotate, headline-reveals-fully, and reduced-motion tests (all still valid).

## PR checklist pass

- Sweep is sourced from the existing `REVEAL_EDGE` (single source of truth), built in the component that renders the clip; no new util, no duplication, no inline styles, no comments. Removing `REVEAL_EDGE_MOBILE` deletes now-dead code. Contracts pinned across canary (CSS), integration (SVG markup), and e2e (behaviour).

## Validation

- `npx vitest run tests/unit tests/canary` green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy.
- CURL `/home`: clip has the translate animateTransform (values from REVEAL_EDGE) + rotate + morph; `.headline`/`.reveal-window` have no animation (check served CSS / canary). `/` (`favoriteSong`), `/api/health` 200, `/homex` 404.
- Screenshot mid-sail and docked: wave sweeps text in, text fully revealed, glyphs never shift. Confirm `animationName` none on `.headline`. Reduced motion shows full docked text.
