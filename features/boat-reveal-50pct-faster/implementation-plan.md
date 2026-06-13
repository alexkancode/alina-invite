# boat-reveal-50pct-faster - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `SAIL_MS` 6667 -> 4444
- `SETTLE_MS` 1333 -> 889
- `REVEAL_DURATION_MS` 8000 -> 5333

`SCENE_TIMELINE` (bounce/CTA start = 5333) re-derives. Whip / bounce-step / lean-cycle
untouched.

## CSS (`src/styles/yait.css`)

- `sail-x`, `sail-weave`: `6.667s -> 4.444s`.
- `reveal-mask`, `reveal-text`: `8s -> 5.333s`.
- `.envelope`: `dock-settle 1.333s 6.667s -> 0.889s 4.444s`; `bob 3.4s 8s -> 3.4s 5.333s`
  (start shifts; 3.4s loop unchanged).
- `lean`, `fry-bounce`, `cta-rise` durations unchanged; their start delays read
  `SCENE_TIMELINE` and shift to 5.333s automatically.
- Keyframe percentages and the dock-segment ease-out unchanged.

## Tests

- `tests/unit/yait/sail-path.test.ts`: reveal duration `8000 -> 5333`.
- `tests/canary/sail-keyframes.canary.ts`: `sail-x 6.667s -> 4.444s`, `sail-weave`
  likewise; `reveal-mask 8s -> 5.333s`, `reveal-text` likewise; single-window regex
  `reveal-mask 8s -> 5.333s`. Ease-out dock-segment assertions unchanged.
- `tests/e2e.yait-home.test.ts`: rescale entrance pins by /1.5:
  `DOCKED_AFTER_MS` 8750 -> 6300 (kept safely past the ~5.3s dock and the 0.9s CTA
  rise); the "reveals fully" midsail wait 6000 -> 2500 (must be below the new dock
  time); mid-bay 3333 -> 2222; no-pause beat pins 1667/1787 -> 1111/1231 (25% of the
  4444ms sail); stern samples 2000/3333/6250 -> 1333/2222/4167 (within the new 4444ms
  sailing window); roll-burst pin 5833 -> remeasure (~3889).
- `tests/unit/yait/whip-edge.test.ts`, `tests/integration/home-page.test.ts`:
  unaffected.

## PR checklist pass

- Only entrance duration constants/literals move, beside their definitions; loop
  durations untouched. No new code, inline styles, duplication, or comments.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `sail-x 4.444s linear`,
  `reveal-mask 5.333s linear`, `dock-settle 0.889s 4.444s`, `bob 3.4s 5.333s`, and the
  loop durations unchanged (`lean 4s`, whip `dur="3.333s"`); 404 and `/api/health` 200.
- Watch /home: entrance lands ~5.3s. To validate boat-reveal-50pct-faster I can time
  the reveal completion (~5.3s).
