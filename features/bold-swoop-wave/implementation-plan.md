# bold-swoop-wave - implementation plan

## Summary

Geometry-and-speed retune of the existing docked, perpetually-rolling wave:

- `WAVE_GEOMETRY.amplitudePx` 12.5 -> 28, `WAVE_GEOMETRY.periods` 5 -> 2.
- `WAVE_ROLL_PERIOD_MS` 1000 -> 700.

Everything else (docked rest position, indefinite roll, clip mechanism, reveal
sweep) is unchanged. `WAVE_ROLL.xBox/yBox` and `WAVE_EDGE_PATH` re-derive from the
new geometry; the markup re-renders the new `to`/`dur`.

## File-by-file

### `src/lib/yait/heroScene.ts`

```ts
export const WAVE_GEOMETRY: WaveGeometry = {
  viewportW: 1280,
  maskH: 185,
  slantPx: 185,
  amplitudePx: 28,
  periods: 2,
  samples: 40
};
...
export const WAVE_ROLL_PERIOD_MS = 700;
```

Derived automatically: `WAVE_ROLL.xBox = 185/1280/2 -> 0.07227`, `yBox = 1/2 = 0.5`,
`WAVE_EDGE_PATH` (broader humps, wider margins `1/periods = 0.5`).

### `src/components/yait/HeroBay.astro`, `src/pages/home.astro`, `src/styles/yait.css`

No change. `dur` renders `0.7s`, `to` renders `0.07227 0.5` from the constants; the
docked rest keyframes and reduced-motion handling are untouched.

## Tests (failure-first)

- `tests/unit/yait/wave-edge.test.ts`:
  - `WAVE_GEOMETRY` toEqual updated to `amplitudePx: 28, periods: 2`.
  - `WAVE_ROLL` xBox/yBox hardcoded expectations updated: `xBox` ~0.07227, `yBox` 0.5.
  - period test: `WAVE_ROLL_PERIOD_MS` and `durationMs` -> 700.
  - crest/trough count assertions track `g.periods` (now 2) - already parameterized.
  - amplitude assertion tracks `g.amplitudePx` - already parameterized.
- `tests/integration/home-page.test.ts`: `to="0.07227 0.5"`, `dur="0.7s"`; the prior
  `to="0.02891 0.2"` / `dur="1s"` removed.
- `tests/e2e.yait-home.test.ts`:
  - "wavy 45-degree slant" swell bounds: amplitude is now ~28px, so the measured
    x-deviation roughly doubles; widen the maxDev/minDev bounds to bracket the
    measured value (set from a live measurement, documented by the constant).
  - The perceptibility floors (`MIN_ROLL_DELTA_PX` during reveal,
    `MIN_DOCKED_ROLL_DELTA_PX` at rest) re-measured; broader/faster crests change at
    least as many pixels, so they stay valid or rise. Adjust only from measurement.
  - Slant ratio (45-degree) unchanged: slantPx == maskH still holds.

## PR checklist pass

- Utility placement / duplication: no new code; two constants change in
  `heroScene.ts` beside their derivations.
- Inline styles / CSS: none changed.
- Testability: `WAVE_GEOMETRY`/`WAVE_ROLL`/`WAVE_EDGE_PATH` stay pure derived values.
- Single purpose: amplitude and periods are the wave-shape knobs; the period is the
  speed knob.
- Comments: none.
- Tests: unit (geometry + roll vector + period), integration (markup attrs), e2e
  (swell magnitude + roll-during-reveal + roll-at-rest, all re-measured).

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `dur="0.7s"`, `to="0.07227 0.5"`,
  `repeatCount="indefinite"`, no `fill="freeze"`; 404 and `/api/health` 200.
- Capture the reveal sequence and the settled docked edge; confirm the broad humps
  read as a travelling swoop and the roll never freezes. To validate bold-swoop-wave
  visually I can review those captures and compare against the timid current version.
