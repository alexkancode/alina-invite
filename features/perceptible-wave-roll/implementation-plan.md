# perceptible-wave-roll - implementation plan

## Summary

Two changes to the existing SMIL roll, both data-derived:

1. `WAVE_ROLL.durationMs` 4000 -> 1000 (one wavelength per second).
2. `WAVE_ROLL` gains `repeatCount`, derived from the reveal span, and the markup
   freezes on it (`fill="freeze"`) instead of looping indefinitely.

No CSS change. No new mechanism. No markup added beyond the two attribute edits.

## File-by-file

### `src/lib/yait/heroScene.ts`

Introduce the roll period as the single design constant and derive the rest:

```ts
export const WAVE_ROLL_PERIOD_MS = 1000;

export const WAVE_ROLL = {
  xBox: Math.round((WAVE_GEOMETRY.slantPx / WAVE_GEOMETRY.viewportW / WAVE_GEOMETRY.periods) * 100000) / 100000,
  yBox: Math.round((1 / WAVE_GEOMETRY.periods) * 100000) / 100000,
  durationMs: WAVE_ROLL_PERIOD_MS,
  repeatCount: Math.ceil((REVEAL_DURATION_MS + REVEAL_TOP_DELAY_MS) / WAVE_ROLL_PERIOD_MS)
};
```

- `xBox`/`yBox` formulas are unchanged (one wavelength in objectBoundingBox units).
- `repeatCount` is the smallest whole number of wavelengths that covers the entire
  reveal (6000ms sweep + 537ms top-line delay = 6537ms). `ceil(6537/1000) = 7`.
  Whole wavelengths guarantee the freeze lands on the rest seam.
- `WAVE_ROLL_PERIOD_MS` replaces the old hand-typed `durationMs: 4000`; it is the
  one intentional speed knob, kept beside its derivations.

`REVEAL_DURATION_MS` (line 75) and `REVEAL_TOP_DELAY_MS` (line 82) already exist
above `WAVE_ROLL` (line 137), so they are in scope; no reordering needed.

### `src/components/yait/HeroBay.astro`

The `<animateTransform>` inside the clipPath:

```astro
<animateTransform
  attributeName="transform"
  type="translate"
  from="0 0"
  to={`${WAVE_ROLL.xBox} ${WAVE_ROLL.yBox}`}
  dur={`${WAVE_ROLL.durationMs / 1000}s`}
  repeatCount={WAVE_ROLL.repeatCount}
  fill="freeze"></animateTransform>
```

- `repeatCount` now binds to the derived integer instead of the literal
  `"indefinite"`.
- `fill="freeze"` holds the final (one-wavelength) transform, which equals rest.

### `src/pages/home.astro`

No change. The reduced-motion inline script removes every `animateTransform` node
regardless of its attributes, so it still strips the roll under reduced motion.

## Tests (failure-first)

### Unit - `tests/unit/yait/wave-edge.test.ts`

Update the `WAVE_ROLL` block to the new contract and add the freeze-at-rest
derivation:

- `durationMs` equals `WAVE_ROLL_PERIOD_MS` (1000).
- `repeatCount` equals `Math.ceil((REVEAL_DURATION_MS + REVEAL_TOP_DELAY_MS) / WAVE_ROLL_PERIOD_MS)`
  and is an integer (so the freeze lands on a seam, not mid-wave).
- `xBox`/`yBox` assertions unchanged (0.02891, 0.2) - proves the speed change did
  not disturb the geometry.
- Add: `repeatCount * WAVE_ROLL_PERIOD_MS >= REVEAL_DURATION_MS + REVEAL_TOP_DELAY_MS`
  (the roll stays live through the entire visible reveal).

### Integration - `tests/integration/home-page.test.ts`

Update the SMIL assertions to the shipped attributes:

- `dur="1s"`, `repeatCount="7"`, `fill="freeze"`.
- Drop the `repeatCount="indefinite"` assertion.
- Keep `<animateTransform`, `attributeName="transform"`, and `to="0.02891 0.2"`.

### Canary - `tests/canary/sail-keyframes.canary.ts`

No change needed (it covers the CSS reveal keyframes and top-line delay, which are
untouched). Re-run to confirm the delay derivation still holds, since `repeatCount`
now also depends on `REVEAL_TOP_DELAY_MS`.

### E2E - `tests/e2e.yait-home.test.ts`

Strengthen the existing roll test from "any pixel changed" to a perceptibility
magnitude, and add a freeze assertion (this is the validation-gap fix the deep dive
flagged, now in scope because the freeze must be proven):

- Mid-reveal (CSS pinned at 3.0s, SMIL free): assert the edge region changes by a
  meaningful pixel count across 0.5s (not just `!= 0`), while a fully-revealed word
  region stays byte-identical (no jitter). Threshold chosen from the measured
  ~52 px/s roll with margin, documented in the test by the constant name, not a
  comment.
- Post-reveal (all animations let run past 7s, then paused): assert the edge region
  is byte-identical across 1s - the roll has frozen at rest.
- Reduced-motion test unchanged (animateTransform count 0).

## PR checklist pass

- Utility placement: no new utility; `repeatCount` derivation lives in `heroScene.ts`
  beside the other reveal/wave constants it depends on. Correct home.
- Inline styles: none added; the animation is SVG SMIL attributes bound to derived
  values, the established pattern for this clipPath. No CSS rule duplicated.
- Duplicated utilities: none; `xBox`/`yBox` formulas are reused as-is, not copied.
- Duplicated style rules: none; CSS untouched.
- Testability/interfaces: `WAVE_ROLL` stays a pure derived constant from
  `WAVE_GEOMETRY` + reveal timeline; fully unit-testable without a DOM. Markup reads
  it; e2e covers rendered behavior.
- Single purpose: `WAVE_ROLL_PERIOD_MS` is the one speed knob; `repeatCount` has the
  single job of covering the reveal span in whole wavelengths.
- Comments: none added.
- Tests: unit (contract + freeze-seam invariant), integration (shipped attributes),
  e2e (perceptible magnitude + frozen-at-rest + no jitter).

## Validation

- `npm run test:api` (vitest: unit + canary + integration) green.
- `npm run test:e2e` (playwright) green, including the strengthened roll test.
- Local rebuild + redeploy, then frame-diff probe (CSS pinned at 3.0s, SMIL free)
  confirming several wavelengths of travel over the reveal window and a byte-stable
  edge after freeze; magnified stills reviewed by eye.
- To validate perceptible-wave-roll visually I can run the app at /home, pin the CSS
  animations at 3.0s in DevTools, and watch crests travel down the slant; then let
  it run past 7s and confirm the edge has stopped moving.
