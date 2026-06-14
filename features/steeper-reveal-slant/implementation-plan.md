# steeper-reveal-slant - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `WHIP_GEOMETRY.slantPx` 370 -> 300. (maskH stays 370.) `WHIP_EDGE_FRAMES` re-derive.

## Tests

- `tests/unit/yait/whip-edge.test.ts`:
  - `WHIP_GEOMETRY` toEqual: `slantPx` 370 -> 300.
  - The "45-degree" assertion `slantPx === maskH` -> `slantPx < maskH` (steeper than
    45, more upright); rename the test accordingly. The bump/flat-ends/no-fold tests
    are geometry-relative (use `g.slantPx`/`g.maskH`) and hold.
- `tests/e2e.yait-home.test.ts`: the "45-degree slant" probe asserts ratio 0.75-1.25;
  the new ratio is ~0.81 (300/370), still in band, so it passes. Rename the test to
  "steep slant" for accuracy (the lobe/maxAbsDev checks are unchanged).
- `tests/integration/home-page.test.ts`: unaffected (markup shape unchanged).

## PR checklist pass

- One geometry constant changes, beside its definition; derived frames stay derived.
  No new code, inline styles, duplication, or comments. Tests updated to the new ratio.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the served morph frames changed (steeper
  slant) and the page serves 200; 404 and `/api/health` 200.
- Screenshot the reveal mid-sweep and confirm the cut line is more vertical than
  before. To validate steeper-reveal-slant I can measure the rendered slant
  horizontal-to-height ratio (~0.81) and confirm one bump still rides it.
