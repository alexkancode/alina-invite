# cut-edge-pivot - implementation plan

## Revert reveal-beat-pivot (letters tilting)

- `src/styles/yait.css`: remove `animation: reveal-pivot ...` from `.headline-mask`,
  delete the `@keyframes reveal-pivot` block, and drop `.headline-mask` from the
  reduced-motion list.
- Tests: remove the reveal-pivot canary test and the e2e "headline reveal swivels"
  test added in reveal-beat-pivot.

## Add the cut-edge rotation (`src/components/yait/HeroBay.astro`)

Add a second animation element inside the clip `<path>`, beside the `<animate>` d
morph:

```astro
<animateTransform
  attributeName="transform"
  type="rotate"
  values="0 0.5 0.5; 8 0.5 0.5; 0 0.5 0.5; 8 0.5 0.5; 0 0.5 0.5"
  keyTimes="0; 0.2083; 0.39; 0.5729; 1"
  dur="5.333s"
  fill="freeze"
  calcMode="spline"
  keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"></animateTransform>
```

- Rotates the clip boundary (objectBoundingBox space) around its centre (0.5, 0.5);
  the `.headline` text is not transformed, so letters stay still.
- Peaks at the reveal inner beats (20.83% / 57.29%), eased, returns to 0 (freeze).
- Angle (8deg) is a starting value tuned visually - it is a 2D tilt, sheared by the
  anisotropic box, so the magnitude is chosen by eye.

The reduced-motion script (`querySelectorAll('animate, animateTransform')`) already
removes it; no script change.

## Tests

- `tests/integration/home-page.test.ts`: assert the clip carries
  `<animateTransform`, `type="rotate"`, `dur="5.333s"`, and the beat `keyTimes`.
- `tests/e2e.yait-home.test.ts`: a new test reads the clip path's animated transform
  (`document.querySelector('#yait-wave-clip path')`) - pinned at a beat it is a
  non-identity rotate, and a fully-revealed glyph region is byte-stable across the
  beat (letters do not move). Remove the reveal-beat-pivot e2e test.
- `tests/canary/sail-keyframes.canary.ts`: remove the reveal-pivot test; the envelope
  pivot test stays.

## PR checklist pass

- The wrong approach is fully reverted (no orphaned reveal-pivot CSS/tests). The new
  effect is one SMIL element on the existing clip path, single purpose. No inline
  styles, no duplication, no comments.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the clip has the rotate `<animateTransform>`
  and no `reveal-pivot` remains; 404 and `/api/health` 200.
- Capture the reveal at a beat vs between and confirm the cut line tilts while a
  revealed glyph stays put. To validate cut-edge-pivot I can diff a glyph region
  across the beat (should be byte-stable) and the edge region (should change).
