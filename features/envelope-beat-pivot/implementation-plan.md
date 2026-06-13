# envelope-beat-pivot - implementation plan

## Markup (`src/components/yait/HeroBay.astro`)

Wrap the flap + fries + art inside a new `<div class="envelope-pivot">` within
`.envelope`. No other markup change; the `data-testid="envelope"` stays on
`.envelope-track`.

## CSS (`src/styles/yait.css`)

```css
.envelope-pivot {
  position: relative;
  animation: pivot 4.444s ease-in-out both;
}

@keyframes pivot {
  0% { transform: perspective(600px) rotateY(0deg); }
  25% { transform: perspective(600px) rotateY(20deg); }
  47% { transform: perspective(600px) rotateY(0deg); }
  68.75% { transform: perspective(600px) rotateY(20deg); }
  100% { transform: perspective(600px) rotateY(0deg); }
}
```

- `position: relative` preserves the absolute positioning of `.envelope-flap` /
  `.fries` (they now position against `.envelope-pivot`, which is sized by
  `.envelope-art` exactly as `.envelope` was).
- Duration matches the sail (4.444s) so the 25% / 68.75% peaks land on the sail beats.
- Reduced-motion: add `.envelope-pivot` to the `animation: none` list so it rests flat
  (rotateY 0) with no motion.

## Tests

- `tests/canary/sail-keyframes.canary.ts`: assert `.envelope-pivot` carries
  `animation: pivot 4.444s ease-in-out both`, and the `pivot` keyframe block has
  `rotateY(20deg)` at `25%` and `68.75%` and `rotateY(0deg)` at `0%`/`47%`/`to`; and
  that `.envelope-pivot` is in the reduced-motion `animation: none` group.
- `tests/e2e.yait-home.test.ts`: a new test pins the sail clock and reads
  `getComputedStyle('.envelope-pivot').transform`: at the beat (1111ms = 25% of 4444)
  it is a non-identity `matrix3d`; between the beats (~2089ms, ~47%) it returns toward
  identity. Assert the beat transform differs from the between transform.
- Existing e2e (flap/fries/art/fry probes) read absolute bounding rects, so the extra
  wrapper does not affect them; re-run to confirm.
- Unit/integration: unaffected (no heroScene/markup-contract change beyond the wrapper).

## PR checklist pass

- One new presentational layer + one keyframe block, placed with the other envelope
  rules; no utility misplacement, no inline styles, no duplication, no comments.
- The pivot is isolated on its own element (single purpose: the beat swivel), so it
  composes with the existing transforms instead of forking them.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the served HTML has `class="envelope-pivot"`
  and the CSS has the `pivot` keyframes; 404 and `/api/health` 200.
- Capture the entrance at a beat and confirm the envelope visibly swivels toward the
  viewer then returns. To validate envelope-beat-pivot I can screenshot at 1111ms vs a
  flat moment and compare the envelope's apparent tilt.
