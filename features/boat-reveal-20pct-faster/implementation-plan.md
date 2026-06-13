# boat-reveal-20pct-faster - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `SAIL_MS` 8000 -> 6667
- `SETTLE_MS` 1600 -> 1333
- `REVEAL_DURATION_MS` 9600 -> 8000

`SCENE_TIMELINE` (bounce/CTA start = 8000) re-derives. Whip / bounce-step / lean-cycle
constants untouched (loops stay).

## CSS (`src/styles/yait.css`)

- `sail-x`, `sail-weave`: `8s -> 6.667s`.
- `reveal-mask`, `reveal-text`: `9.6s -> 8s`.
- `.envelope`: `dock-settle 1.6s 8s -> 1.333s 6.667s`; `bob 3.4s 9.6s -> 3.4s 8s`
  (start shifts to the new dock time; the 3.4s loop duration is unchanged).
- `lean`, `fry-bounce`, `cta-rise` durations unchanged (loops/rise); their start
  delays read `SCENE_TIMELINE` and shift to 8s automatically.
- Keyframe percentages and the dock-segment ease-out are unchanged.

## Tests

- `tests/unit/yait/sail-path.test.ts`: reveal duration `9600 -> 8000`.
- `tests/canary/sail-keyframes.canary.ts`: `sail-x 8s linear -> 6.667s linear`,
  `sail-weave` likewise; `reveal-mask 9.6s linear -> 8s linear`, `reveal-text`
  likewise; the single-window regex `reveal-mask 9.6s -> 8s`. The 6 ease-out
  dock-segment assertions are unchanged.
- `tests/e2e.yait-home.test.ts`: rescale entrance pins by /1.2:
  `DOCKED_AFTER_MS` 10500 -> 8750; mid-bay 4000 -> 3333; no-pause beat pins
  2000/2120 -> 1667/1787 (25% of the 6667ms sail); stern samples 2400/4000/7500 ->
  2000/3333/6250 (within the new 6667ms sailing window); roll-burst pin 7000 ->
  remeasure (~5833).
- `tests/unit/yait/whip-edge.test.ts`, `tests/integration/home-page.test.ts`:
  unaffected (whip/markup unchanged).

## PR checklist pass

- Only entrance duration constants/literals move, beside their definitions; loop
  durations explicitly untouched. No new code, inline styles, duplication, or comments.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms served CSS carries `sail-x 6.667s linear`,
  `reveal-mask 8s linear`, `dock-settle 1.333s 6.667s`, `bob 3.4s 8s`, and that the
  loop durations (`lean 4s`, whip `dur="3.333s"`) are unchanged; 404 and
  `/api/health` 200.
- Watch /home: entrance lands at ~8s; whip/idle loops feel the same. To validate
  boat-reveal-20pct-faster I can time the reveal completion (~8s).
