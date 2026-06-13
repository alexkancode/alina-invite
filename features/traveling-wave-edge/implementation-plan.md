# traveling-wave-edge - implementation plan

## Mechanism

1. Dock the resting edge over the text by changing ONLY the final reveal waypoint:
   `buildRevealEdge` appends `{ offset: 1, percent: REVEAL_REST_PERCENT }` instead of
   `{ offset: 1, percent: 0 }`. Every sailing waypoint is unchanged, so the boat-
   synced sweep and its stern-locked mid-sweep tracking are untouched; only the
   resting point shifts left, sliding the wavy slant onto the headline trailing edge.
2. Roll forever: `WAVE_ROLL` drops `repeatCount`; the markup uses
   `repeatCount="indefinite"` and no `fill="freeze"`. `WAVE_ROLL_PERIOD_MS` reverts
   333 -> 1000 (readable on a stationary edge; the 333 shimmer was for the moving
   case).

## File-by-file

### `src/lib/yait/heroScene.ts`

- Add `export const REVEAL_REST_PERCENT = -18;` (starting value; tuned visually so
  the slant grazes the tail of the longer line while keeping letters readable).
- `buildRevealEdge(track, hull, restPercent)`: append `{ offset: 1, percent: restPercent }`.
- `REVEAL_EDGE` and `REVEAL_EDGE_MOBILE` pass `REVEAL_REST_PERCENT`.
- `WAVE_ROLL`: remove `repeatCount`; `WAVE_ROLL_PERIOD_MS = 1000`. Remove the freeze
  derivation.

`REVEAL_TOP_DELAY_MS` uses `edge[0].percent` (start), so it is unaffected.

### `src/components/yait/HeroBay.astro`

`animateTransform`: `repeatCount="indefinite"`, drop `fill="freeze"`. (`dur` renders
`1s` from the reverted period.)

### `src/styles/yait.css`

- `reveal-mask` / `reveal-mask-mobile` `to` keyframe: `translateX(REVEAL_REST_PERCENT%)`.
- `reveal-text` / `reveal-text-mobile` `to` keyframe: `translateX(-REVEAL_REST_PERCENT%)`
  (counter, keeps the text in place; `-(-18)=18`).
- No other rule changes. The `prefers-reduced-motion` block already sets
  `animation: none` on the lines, so reduced motion rests at translateX 0 (text fully
  revealed, no docking, no motion) - the accessible state.

### `src/pages/home.astro`

No change.

## Tests (failure-first)

- `tests/unit/yait/sail-path.test.ts`: the end-percent assertion
  `edge[edge.length-1].percent` becomes `REVEAL_REST_PERCENT` (import it). Monotonic
  check still holds (-39 < -18). The `buildRevealEdge` equality call passes the new
  arg.
- `tests/unit/yait/wave-edge.test.ts`: `WAVE_ROLL` no longer has `repeatCount`;
  `WAVE_ROLL_PERIOD_MS` is 1000; remove the freeze-seam tests; keep xBox/yBox.
- `tests/integration/home-page.test.ts`: assert `dur="1s"`,
  `repeatCount="indefinite"`, and NOT `fill="freeze"` / NOT `repeatCount="20"`.
- `tests/canary/sail-keyframes.canary.ts`: no edit needed - it derives expected
  keyframe strings from `REVEAL_EDGE` (mask) and `-percent` (text), so it tracks the
  new rest percent automatically once heroScene and the CSS agree.
- `tests/e2e.yait-home.test.ts`:
  - Keep the burst-based "wave rolls perceptibly" test (mid-reveal, CSS pinned at
    3.0s, SMIL free); the roll still happens during the sweep.
  - Replace "freezes at rest" with "keeps rolling at rest": after the reveal
    completes (wait past 7s, no pinning), the docked edge region still changes across
    a short burst (the wave never freezes). Pick a region over the docked slant where
    it crosses ink (line 2 tail) rather than empty sky.
  - Reduced-motion test (animateTransform count 0) unchanged.

## PR checklist pass

- Utility placement: `REVEAL_REST_PERCENT` and the `restPercent` param live in
  `heroScene.ts` beside the reveal geometry they belong to.
- Inline styles / CSS duplication: keyframe `to` values only; no rule duplicated; the
  counter-translate mirrors the existing reveal pattern.
- Duplicated utilities: none; `buildRevealEdge` gains one parameter, not a fork.
- Testability: `REVEAL_EDGE`/`WAVE_ROLL` stay pure derived constants; unit-testable
  without a DOM.
- Single purpose: `REVEAL_REST_PERCENT` is the one resting-position knob.
- Comments: none.
- Tests: unit (edge end + roll shape), integration (SMIL attrs), canary
  (auto-derived keyframes), e2e (rolls during reveal + keeps rolling at rest).

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `dur="1s"`, `repeatCount="indefinite"`,
  no `fill="freeze"`; 404 and health checks.
- Screenshot the settled headline and review where the docked edge grazes; tune
  `REVEAL_REST_PERCENT` for a visible graze that keeps letters readable. To validate
  traveling-wave-edge I can capture a burst of the settled headline and confirm the
  grazed edge changes frame-to-frame (the wave keeps traveling) and review stills for
  readability.
