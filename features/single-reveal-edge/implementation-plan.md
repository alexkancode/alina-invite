# single-reveal-edge - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
Wrap the whole `<h1 class="headline">` in one `<div class="reveal-window">`; the
lines become plain `<span class="headline-line">` (with `headline-line-indent` on the
second), no per-line `.line-mask` wrapper, no `line-mask-top`.

### `src/styles/yait.css`
- New `.reveal-window`: `display: block; overflow: hidden; clip-path:
  url(#yait-wave-clip); animation: reveal-mask 12s cubic-bezier(0.37,0,0.63,1) both;`
- `.headline`: add `animation: reveal-text 12s cubic-bezier(0.37,0,0.63,1) both;`
  (the single counter-sweep), keep all existing type styles.
- Remove `.line-mask`, `.line-mask-top`, `.line-mask-top .headline-line`.
- `.headline-line`: keep `display: block`, drop the animation.
- Mobile media: `.reveal-window { animation-name: reveal-mask-mobile; }` and
  `.headline { animation-name: reveal-text-mobile; }` (replacing the `.line-mask` /
  `.headline-line` overrides).
- Reduced-motion list: `.reveal-window, .headline` (replacing `.line-mask,
  .headline-line`).
- `reveal-mask` / `reveal-text` (+ mobile) keyframes unchanged.

### `src/lib/yait/heroScene.ts`
- `WHIP_GEOMETRY.maskH` and `slantPx` 185 -> 370 (45 degrees across the block).
- Remove `REVEAL_STAGGER_PX`, `REVEAL_TOP_DELAY_MS`, and the `revealDelayMs` helper
  (dead once the stagger is gone). `REVEAL_EDGE` / `REVEAL_REST_PERCENT` / reveal
  keyframe derivations stay.

## Tests

- `tests/unit/yait/whip-edge.test.ts`: `WHIP_GEOMETRY` maskH/slantPx -> 370 (still
  `slantPx === maskH`). Bump/taper tests are geometry-relative and hold.
- `tests/unit/yait/sail-path.test.ts`: delete the "independent top-line reveal delay"
  describe and the now-removed imports (`REVEAL_STAGGER_PX`, `REVEAL_TOP_DELAY_MS`,
  `revealDelayMs`).
- `tests/canary/sail-keyframes.canary.ts`: drop the `REVEAL_TOP_DELAY_MS` import and
  the "top line is an independent entity trailing purely by delay" test. Keep the
  reveal-mask/reveal-text waypoint + duration checks and the
  `not.toMatch(/reveal-mask-top|reveal-text-top/)` guard.
- `tests/e2e.yait-home.test.ts`:
  - stern test and slant test: selector `.line-mask:not(.line-mask-top)` ->
    `.reveal-window`.
  - delete the "lines reveal as independent entities" test.
  - the 45-degree ratio now measures across the block; re-measure and keep the
    0.75-1.25 tolerance (tune `WHIP_GEOMETRY.maskH` to the measured window height if
    the ratio drifts out of band).
- `tests/integration/home-page.test.ts`: unaffected (no per-line refs); the single
  `<animate>` and clip id still assert true.

## PR checklist pass

- Dead stagger code removed, not orphaned. One generator, constants beside it.
- No inline styles; CSS rules consolidated (one mask rule instead of per-line), no
  duplication; reduced-motion and mobile lists updated in place.
- Single purpose: `.reveal-window` clips+sweeps, `.headline` counter-sweeps.
- No comments.
- Tests updated; per-line assertions removed, single-edge behavior covered.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms one `class="reveal-window"`, the `.headline`
  carries `reveal-text`, no `line-mask` in the served HTML, one `<animate>`; 404 and
  `/api/health` 200.
- Capture the reveal: one continuous diagonal edge wipes both lines together, no
  trailing line. To validate single-reveal-edge I can confirm both lines start
  revealing from the same sweep with no per-line delay.
