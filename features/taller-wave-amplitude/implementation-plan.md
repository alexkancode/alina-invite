# taller-wave-amplitude - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `WHIP_GEOMETRY.amplitudePx` 34 -> 50.

`WHIP_EDGE_FRAMES` re-derive. No other source change; markup/CSS untouched.

## Tests (`tests/unit/yait/whip-edge.test.ts`)

- `WHIP_GEOMETRY` toEqual: `amplitudePx` 34 -> 50.
- "baseline is straight away from the bump": the Gaussian tail at the filter boundary
  scales with amplitude (~1.15px at 50px vs ~0.78px at 34px), so the fixed 1px
  tolerance is brittle. Change it to a relative tolerance (`< g.amplitudePx * 0.05`,
  i.e. the baseline is flat to within 5% of the bump height) - principled and stable
  across amplitudes.
- One-lobe / peak-~amplitude / flat-ends / no-fold tests are amplitude-relative and
  hold automatically.

E2E "single whip bump" (maxAbsDevPx > 20, one lobe) and "wave rolls perceptibly" hold
(bigger bump -> larger deviation/change). Integration unaffected.

## PR checklist pass

- One geometry constant changes, beside its definition; derived frames stay derived.
  The test tolerance becomes relative (more robust), not duplicated logic. No inline
  styles, no comments.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the served morph frames changed (new
  amplitude) and the page still serves 200; 404 and `/api/health` 200.
- Capture the reveal and compare the crest height to the prior 34px bump. To validate
  taller-wave-amplitude I can measure the mid-frame max perpendicular deviation and
  confirm it tracks ~50px.
