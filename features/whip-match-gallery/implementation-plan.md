# whip-match-gallery - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `WHIP_GEOMETRY.widthFrac` 0.09 -> 0.16667.
- `WHIP_CENTER_MIN` 0.18 -> 0; `WHIP_CENTER_MAX` 0.82 -> 1.
- `WHIP_HALF_FRAMES` 8 -> 12 (smooth end-to-end morph).
- `WHIP_DURATION_MS` 1400 -> 3333.
- `buildWhipEdgePath` offset gains the `sin(pi*s)` taper:
  `offset(s) = amp * sin(pi*s) * gaussian(s)`, with the matching analytic derivative
  for the tangents. The bump now swells mid-slant and is exactly 0 at s=0 and s=1 for
  any center, so the slant ends are always flat (no exposed corner).

`WHIP_EDGE_FRAMES` re-derives (25 frames now). `HeroBay.astro`, `home.astro`, CSS:
no change (markup reads `WHIP_EDGE_FRAMES` / `WHIP.durationMs`).

## Tests

- `tests/unit/yait/whip-edge.test.ts`:
  - `WHIP_GEOMETRY.widthFrac` -> 0.16667.
  - bump test uses center 0.5 (taper = 1 there) so peak is still ~amplitude; single
    lobe still holds.
  - flat-ends test: now exact 0 at ends for every center (centers list -> 0, 0.5, 1).
  - `whipCenters` endpoints -> 0 and 1; frame count 2*12+1 = 25.
  - `WHIP.durationMs` -> 3333.
- `tests/integration/home-page.test.ts`: `dur="3.333s"` (was `1.4s`).
- `tests/e2e.yait-home.test.ts`: the static frame-0 path now has the bump at the
  tapered end (center 0), i.e. a near-straight slant, so the "single bump" deviation
  probe no longer applies to frame 0. Simplify that test to assert the clip is applied
  and the slant is ~45 degrees (bump shape stays fully unit-tested; bump motion stays
  covered by the roll-burst test). Re-measure the roll-burst floor: the slower whip
  changes fewer pixels per burst, so widen the burst window and/or lower
  `MIN_ROLL_DELTA_PX` from a fresh measurement.

## PR checklist pass

- One generator, constants beside it; derived frames stay derived.
- No inline styles / CSS changes; no comments.
- Single purpose maintained (offset shape, center schedule, timing).
- Tests updated to the new contract; ends-flat invariant strengthened.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `dur="3.333s"`, `<animate attributeName="d"`,
  25 morph frames; 404 and `/api/health` 200.
- Capture the reveal and compare bump breadth, end-to-end travel, mid swell, and
  cadence to the gallery #7 panel.
