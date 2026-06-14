# smooth-cloud-curves - implementation plan

## Source

### tracer (`/tmp/cloud-sample/trace.py`, the data generator)
- Add a single-purpose helper `catmull_rom_closed(pts)` that returns the `d` for one
  closed loop as cubic beziers (uniform Catmull-Rom, cyclic indices, /6 tangents).
- `path_d` calls `catmull_rom_closed` per simplified loop instead of joining points
  with `L`. RDP tolerance unchanged (faithful).
- Regenerate `/tmp/cloud-sample/clouds-traced.svg` and re-extract the three layer
  paths.

### `src/lib/yait/cloudArt.ts`
- Regenerate from the smoothed trace: same three tone layers, same coordinate space,
  `d` strings now use `C` segments. No interface change.

## Tests (TDD)

### `tests/unit/yait/cloud-art.test.ts`
- Tighten the closed-path test: each layer `d` still starts with `M`, ends with `Z`,
  has >= 1 subpath, AND now contains cubic bezier segments (`C`) and no straight
  line segments (no ` L ` between the smoothed points). Determinism + tone order +
  positive coordinate space tests stay.

### unchanged suites (re-run to confirm no regression)
- `tests/canary/sail-keyframes.canary.ts`, `tests/integration/home-page.test.ts`,
  `tests/e2e.yait-home.test.ts` do not inspect path command letters; they should stay
  green.

## PR checklist pass

- The smoothing lives in the data generator (where the geometry is produced), not in
  the component or a misplaced util. `catmull_rom_closed` is one purpose.
- No inline styles, no duplicated helpers, no duplicated style rules; no comments.
- `CLOUD_ART` stays a typed constant; the unit test pins the new bezier contract.
- Only the committed path data changes; markup/CSS untouched, so no risk to layout,
  motion, or reduced-motion behaviour.

## Validation

- `npx vitest run tests/unit/yait/cloud-art.test.ts` green (bezier contract).
- Full yait unit + canary green; rebuild; integration green; e2e green.
- Take down local server, rebuild, redeploy.
- CURL `/home` and grep that each cloud-layer path `d` contains `C` (curved) and the
  three layers + warp + cyan sky are still present; `/` (`favoriteSong`) and
  `/api/health` regression intact; `/homex` 404.
- Screenshot the hero and compare lobe edges to the prior faceted capture: smoother
  curves, same shapes/arrangement. To validate smooth-cloud-curves I can overlay or
  diff the new and old hero captures and confirm the silhouette occupies the same
  region while the edges are rounder.
