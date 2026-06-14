# subtler-cloud-motion - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
- `feDisplacementMap`: `scale="6"` -> `scale="4"`; animate `values="6;13;8;6"` ->
  `values="4;9;6;4"`. `baseFrequency` and its animation unchanged.

### `src/styles/yait.css`
- `@keyframes swell-tall`: `45% scale(1.011,1.03)` -> `scale(1.008,1.021)`;
  `75% scale(0.995,0.987)` -> `scale(0.997,0.991)`.
- `@keyframes swell-flat`: `50% scale(1.022,0.984)` -> `scale(1.015,0.989)`;
  `80% scale(0.992,1.015)` -> `scale(0.994,1.011)`.
- Durations, phases, transform-origin, fills unchanged.

## Tests

- No contract change: the canary already pins the keyframe names, per-layer animation
  references, fills, and reduced-motion membership; the integration pins the markup;
  the e2e pins three layers, live breathing (bbox changes over ~2.2s - still true at
  lower amplitude), and reduced-motion rest. All re-run, no edits expected.
- Pinning exact scale percentages in a test would be brittle and low value, so the
  amplitude itself is verified empirically (screenshot pixel-diff), not asserted.

## PR checklist pass

- Pure value tune in the two files that already own these knobs; no new util, no
  inline styles, no duplicated rules, no comments. Single concern (amplitude).

## Validation

- `npx vitest run tests/unit tests/canary` green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy locally.
- Screenshot two hero frames ~2.3s apart; confirm sky-band changed pixels drops below
  the prior ~9.8% but stays clearly non-zero; confirm reduced motion rests the clouds.
- CURL `/home` (three cloud layers + warp + cyan sky still present), `/`
  (`favoriteSong`), `/api/health` 200, `/homex` 404.
