# reveal-beat-pivot - implementation plan

## CSS (`src/styles/yait.css`) - only source change

Add the pivot animation to `.headline-mask` (which has no transform today) and a new
keyframe block:

```css
.headline-mask {
  /* existing rules ... */
  animation: reveal-pivot 5.333s ease-in-out both;
}

@keyframes reveal-pivot {
  0% { transform: perspective(2000px) rotateY(0deg); }
  20.83% { transform: perspective(2000px) rotateY(20deg); }
  39% { transform: perspective(2000px) rotateY(0deg); }
  57.29% { transform: perspective(2000px) rotateY(20deg); }
  to { transform: perspective(2000px) rotateY(0deg); }
}
```

- Peaks at the reveal's inner beats (20.83% / 57.29%) over the 5.333s reveal, so they
  hit the same real-time moments as the envelope pivot.
- `perspective(2000px)` (vs the envelope's 600px) keeps the wide headline a gentle
  swivel; tuned visually, adjust if it distorts.
- Add `.headline-mask` to the `prefers-reduced-motion` `animation: none` group.

No markup change (the pivot rides the existing `.headline-mask`).

## Tests

- `tests/canary/sail-keyframes.canary.ts`: assert `.headline-mask` carries
  `animation: reveal-pivot 5.333s ease-in-out both`; the `reveal-pivot` keyframe block
  has `rotateY(20deg)` at `20.83%` and `57.29%` and `rotateY(0deg)` at `0%`/`39%`/`to`;
  and `.headline-mask` is in the reduced-motion group.
- `tests/e2e.yait-home.test.ts`: a new test pins the reveal clock and reads
  `getComputedStyle('.headline-mask').transform`: at a beat (1111ms) it is a
  non-identity `matrix3d`; between beats (~2200ms) it returns toward identity. Assert
  the beat transform contains `matrix3d` and differs from the between transform.
- Existing tests read `.headline-line` / words by bounding rect and computed opacity,
  which are unaffected by a 3D transform on the ancestor; re-run to confirm. (If the
  rotateY perturbs the left-aligned-lockup left-position probe beyond its +/-5px band,
  that probe pins no animation time so it samples the resting state where the pivot is
  flat - no impact.)

## PR checklist pass

- One animation added to an existing container + one keyframe block, beside the other
  reveal/keyframe rules; no utility misplacement, inline styles, duplication, or
  comments. Single purpose (the reveal beat swivel) on its own animation.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the CSS has the `reveal-pivot` keyframes and
  `.headline-mask` animation; 404 and `/api/health` 200.
- Capture the entrance at a beat and confirm the headline swivels toward the viewer in
  unison with the envelope, returning flat. To validate reveal-beat-pivot I can
  screenshot at 1111ms vs a flat moment and compare the headline tilt, and tune the
  perspective if it reads distorted.
