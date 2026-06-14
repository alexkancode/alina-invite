# remove-clouds - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Delete `CloudShape`, `CloudSpec`, `CloudLayout` interfaces.
- Delete `CLOUD_LOBES`, `CLOUD_HALF_WIDTH`, `CLOUD_PEAK` constants.
- Delete `buildCloud(spec)`.
- Delete the `CLOUDS` array.
- Keep `createSeededRandom` (still used by `buildFryCrowd`) and everything else.

### `src/components/yait/HeroBay.astro`
- Drop `buildCloud` and `CLOUDS` from the `heroScene` import (keep the rest).
- Delete the `<linearGradient id="yait-cloud-grad">` def (no other consumer).
- Delete the entire `{CLOUDS.map(...)}` block (cloud groups, rim-glow ellipse,
  cloud path). The sky rect, sun circles, gulls, sea, headline, and envelope stay.

### `src/styles/yait.css`
- Delete the `.cloud`, `.cloud-inner`, `.cloud-glow` rules and the
  `.cloud--1..6` / `.cloud-inner--1..6` per-cloud rules.
- Delete the `cloud-drift`, `cloud-bob`, `cloud-breathe`, `glow-breathe` keyframes.
- Remove `.cloud`, `.cloud-inner`, `.cloud-glow` from the reduced-motion group
  (leave the remaining selectors and their trailing block intact).

## Tests

- `tests/unit/yait/clouds.test.ts`: delete the file (the unit subject is gone).
- `tests/integration/home-page.test.ts`: remove the two cloud assertions
  (`ships sunset clouds...`, `ships the pulsing rim-glow...`). Replace with one
  `the hero sky carries no clouds` test asserting the served HTML has no
  `class="cloud`, no `cloud-glow`, and no `yait-cloud-grad`, while the sun
  (`<circle ... r="58"`) and headline words still render. Keep all non-cloud tests.
- `tests/e2e.yait-home.test.ts`: delete the three cloud tests (drift, rim-glow
  pulse, reduced-motion rest). Add one `no clouds render in the hero` test
  asserting `.cloud` count 0 and `.cloud-glow` count 0. Keep the rest.
- `tests/canary/sail-keyframes.canary.ts`: delete the two cloud keyframe tests
  (`drift, bob and breathe...`, `rim-glow pulses...`) and assert the keyframes
  and `.cloud-glow` rule are absent from the CSS. Keep the sail/reveal/pivot/
  reduced-motion tests (the reduced-motion group still exists for the envelope).

## PR checklist pass

- Pure deletion plus tightened guards: no new utility, no inline styles, no
  duplicated rules, no comments. `createSeededRandom` is retained because
  `buildFryCrowd` still depends on it - removing it would break the fry crowd.
- The reduced-motion `@media` block keeps its non-cloud selectors so envelope /
  headline / fry motion still rests; only the three cloud selectors are pruned.
- Absence is locked down by tests at three layers (integration DOM, e2e runtime,
  canary CSS) so a future re-add cannot silently slip back in.

## Validation

- `npx vitest run tests/unit tests/canary` green for yait; integration green
  against the rebuilt server; `npx playwright test e2e.yait-home.test.ts` green.
- Take down the local server, rebuild, redeploy locally.
- CURL `/home` and grep: zero `class="cloud`, zero `cloud-glow`, zero
  `yait-cloud-grad`; sun circles and headline words still present.
- CURL `/` and confirm `name="favoriteSong"` still served (corner clouds intact);
  `/api/health` 200; unknown route 404.
- gnome-screenshot the sky band and confirm a clear gradient sky with the sun,
  gulls, sea, headline, and envelope and no cloud silhouettes. To validate
  remove-clouds I can compare this capture to the prior cloud screenshot and
  confirm every cloud puff is gone while nothing else shifted.
