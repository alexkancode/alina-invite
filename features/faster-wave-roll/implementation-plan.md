# faster-wave-roll - implementation plan

## Summary

One-constant retune of the existing SMIL roll: `WAVE_ROLL_PERIOD_MS` 1000 -> 333.
Everything else (roll vector, `repeatCount` derivation, `fill="freeze"`, CSS,
reduced-motion script) is unchanged; `repeatCount` re-derives 7 -> 20 and the markup
emits `dur="0.333s"`.

## File-by-file

### `src/lib/yait/heroScene.ts`

```ts
export const WAVE_ROLL_PERIOD_MS = 333;
```

`WAVE_ROLL` is unchanged in shape: `durationMs` already reads `WAVE_ROLL_PERIOD_MS`
and `repeatCount` already reads `Math.ceil((REVEAL_DURATION_MS + REVEAL_TOP_DELAY_MS)
/ WAVE_ROLL_PERIOD_MS)`, so it becomes `{ ..., durationMs: 333, repeatCount: 20 }`
with no other edit.

### `src/components/yait/HeroBay.astro`

No change. `dur={`${WAVE_ROLL.durationMs / 1000}s`}` renders `dur="0.333s"` and
`repeatCount={WAVE_ROLL.repeatCount}` renders `repeatCount="20"` from the derived
constant.

### `src/pages/home.astro`

No change.

## Tests (failure-first)

### Unit - `tests/unit/yait/wave-edge.test.ts`

- Update the speed test from "one wavelength per second" to the new period:
  `expect(WAVE_ROLL_PERIOD_MS).toBe(333)` and `expect(WAVE_ROLL.durationMs).toBe(333)`.
- The `WAVE_ROLL` `toEqual` block and the freeze-seam invariant are generic
  (derive from `WAVE_ROLL_PERIOD_MS` and the reveal span); they stay and now assert
  `repeatCount = 20` implicitly. Add an explicit `expect(WAVE_ROLL.repeatCount).toBe(20)`
  for a readable contract.

### Integration - `tests/integration/home-page.test.ts`

- `dur="0.333s"`, `repeatCount="20"`; keep `fill="freeze"`, `to="0.02891 0.2"`,
  `attributeName="transform"`; keep `not.toContain('repeatCount="indefinite"')`.

### E2E - `tests/e2e.yait-home.test.ts`

- The perceptibility floor (`MIN_ROLL_DELTA_PX = 800`) and the freeze test are speed-
  agnostic and still correct (faster roll changes at least as many pixels; freeze
  still reaches rest). Re-measure the mid-reveal delta at the new speed and confirm
  it stays comfortably above 800; only raise the floor if the measured margin makes
  a higher floor a stronger guard without flakiness. No structural change expected.

## PR checklist pass

- Utility placement: no new utility; the one changed value lives beside its
  derivations in `heroScene.ts`.
- Inline styles / CSS duplication: none; CSS untouched.
- Duplicated utilities/rules: none.
- Testability/interfaces: `WAVE_ROLL` stays a pure derived constant; fully unit-
  testable without a DOM.
- Single purpose: `WAVE_ROLL_PERIOD_MS` remains the single speed knob; `repeatCount`
  keeps its one job (cover the reveal in whole wavelengths).
- Comments: none added.
- Tests: unit (period + repeatCount), integration (shipped attributes), e2e
  (perceptible magnitude + frozen-at-rest, re-measured).

## Validation

- `npx vitest run` on the in-scope yait files green.
- `npx playwright test e2e.yait-home.test.ts` green, including the re-measured roll
  test.
- Local rebuild + redeploy; CURL confirms `dur="0.333s"`, `repeatCount="20"`,
  `fill="freeze"`, derived vector present, old `dur="1s"`/`repeatCount="7"` absent;
  bogus route 404; `/api/health` 200.
- Magnified mid-reveal frames at small steps reviewed for swell-vs-shimmer; to
  validate faster-wave-roll I can compare those frames against the 1s-period
  captures and report whether the crests still read as rolling.
