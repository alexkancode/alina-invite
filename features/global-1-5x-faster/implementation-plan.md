# global-1-5x-faster - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `SAIL_MS` 8000 -> 5333
- `SETTLE_MS` 1600 -> 1067
- `REVEAL_DURATION_MS` 9600 -> 6400
- `WHIP_DURATION_MS` 3333 -> 2222
- `BOUNCE_STEP_MS` 90 -> 60
- `LEAN_CYCLE_MS` 4000 -> 2667

`SCENE_TIMELINE` (bounceStart/ctaRise = SAIL_MS+SETTLE_MS = 6400) and the fry crowd
delays re-derive. No new symbols; beats/positions untouched.

## CSS (`src/styles/yait.css`)

- `sail-x`, `sail-weave`: `8s -> 5.333s`
- `reveal-mask`, `reveal-text`: `9.6s -> 6.4s`
- `.envelope`: `dock-settle 1.6s 8s -> 1.067s 5.333s`; `bob 3.4s 9.6s -> 2.267s 6.4s`
- `.fry`: `lean 4s -> 2.667s`; `fry-bounce 1.1s -> 0.733s`
- `.club`: `cta-rise 0.9s -> 0.6s`

Keyframe time-percentages unchanged (beats unchanged).

## Tests

- `tests/unit/yait/sail-path.test.ts`: reveal duration assertion `9600 -> 6400`.
- `tests/unit/yait/whip-edge.test.ts`: `WHIP.durationMs` `3333 -> 2222`.
- `tests/unit/yait/hero-scene.test.ts`: no change - the `BOUNCE_STEP_MS` /
  `LEAN_CYCLE_MS` assertions are derived comparisons (auto-hold); literal-arg
  `staggerDelays` tests are independent.
- `tests/canary/sail-keyframes.canary.ts`: literal durations `sail-x 8s -> 5.333s`,
  `sail-weave 8s -> 5.333s`, `reveal-mask 9.6s -> 6.4s`, `reveal-text 9.6s -> 6.4s`,
  and the single-window regex `reveal-mask 9.6s -> 6.4s`. Keyframe waypoint
  percentages unchanged.
- `tests/integration/home-page.test.ts`: whip `dur="3.333s" -> "2.222s"`.
- `tests/e2e.yait-home.test.ts`: rescale the time-coupled pins by /1.5:
  `DOCKED_AFTER_MS` 10500 -> 7000; mid-bay pin 4000 -> 2667; stern samples
  2400/4000/7500 -> 1600/2667/5000 (within the new 5333ms sailing window); wave-rolls
  pin 7000 -> remeasure (~4667). Re-measure the roll burst at the faster whip.

## PR checklist pass

- Only duration constants/literals move, beside their definitions; derived values
  stay derived. No new utilities, inline styles, duplication, or comments.
- Tests updated to the scaled timeline; canary keeps CSS and constants in lockstep.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms served CSS carries `sail-x 5.333s`,
  `reveal-mask 6.4s`, `dock-settle 1.067s 5.333s`, `bob 2.267s 6.4s`, `lean 2.667s`,
  `fry-bounce 0.733s`, `cta-rise 0.6s`, and the whip `dur="2.222s"`; 404 and
  `/api/health` 200.
- Watch /home: the entrance lands at ~6.4s and the whip cracks faster. To validate
  global-1-5x-faster I can time the reveal completion (~6.4s) and one whip cycle
  (~2.22s).
