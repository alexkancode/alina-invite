# faster-first-leg - implementation plan

## Source (`src/lib/yait/heroScene.ts`)

- `SAIL_TRACK`: middle offsets `0.4 -> 0.25`, `0.75 -> 0.6875` (xVw unchanged).
- `SAIL_WEAVE`: middle offsets `0.4 -> 0.25`, `0.75 -> 0.6875` (yPx/rotate/scale
  unchanged) so the weave apexes still land on track beats.
- `SAIL_MS` 10000 -> 8000.
- `SETTLE_MS` 2000 -> 1600.
- `REVEAL_DURATION_MS` 12000 -> 9600.

`REVEAL_EDGE` / `REVEAL_EDGE_MOBILE` and `SCENE_TIMELINE` re-derive. No new symbols.

## CSS (`src/styles/yait.css`)

Keyframe time-percentages (positions unchanged):
- `sail-x`, `sail-weave`: `40% -> 25%`, `75% -> 68.75%`.
- `reveal-mask`, `reveal-text`, `reveal-mask-mobile`, `reveal-text-mobile`:
  `33.33% -> 20.83%`, `62.5% -> 57.29%` (the `83.33%` and `to` frames stay).

Durations / starts:
- `sail-x`, `sail-weave`: `10s -> 8s`.
- `reveal-mask`, `reveal-text`: `12s -> 9.6s`.
- `.envelope` `dock-settle 2s 10s -> 1.6s 8s`; `bob 3.4s 12s -> 3.4s 9.6s`.

(`--fry-delay` and `--cta-delay` read `SCENE_TIMELINE`, so they shift to 9.6s with no
edit.)

## Tests

- `tests/unit/yait/sail-path.test.ts`: the `reveal duration` describe -> 9600. The
  SAIL_TRACK tests assert length/first/last/strictly-increasing (no hardcoded middle
  beats), so they hold. The "track offsets rescaled into the sail share" and
  "beats align" tests are derived and hold with the matched SAIL_WEAVE beats.
- `tests/unit/yait/hero-scene.test.ts`: SCENE_TIMELINE invariants only - hold.
- `tests/canary/sail-keyframes.canary.ts`: literal durations `sail-x 10s` -> `8s`,
  `sail-weave 10s` -> `8s`, `reveal-mask 12s` -> `9.6s`, `reveal-text 12s` -> `9.6s`.
  The keyframe waypoint percentages auto-derive from the updated constants.
- `tests/e2e.yait-home.test.ts`:
  - `DOCKED_AFTER_MS` 13200 -> ~10500 (after the 9.6s reveal/dock).
  - mid-bay "halfway through the sail" pin `currentTime 5000 -> 4000` (half of 8s);
    still expects translateX < -300.
  - "wave rolls perceptibly" pin `currentTime 10500 -> remeasure` (the edge now
    crosses the text earlier, and the reveal ends at 9.6s); re-pin and re-check the
    burst floor from a fresh measurement.
  - "reveal edge sits at the stern" samples stay within the sailing window (< 8000ms)
    and the edge-tracks-stern invariant holds by the sync coupling; re-run to confirm.
- `tests/integration/home-page.test.ts`: no entrance-duration refs - unaffected.

## PR checklist pass

- Only constant/keyframe values move, beside their definitions; derived values stay
  derived (REVEAL_EDGE, SCENE_TIMELINE). No new utilities, no inline styles, no
  duplication, no comments.
- Tests updated to the new timeline; canary keeps CSS and constants in lockstep.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms served CSS carries `sail-x 8s`,
  `reveal-mask 9.6s`, `sail-x ... 25%`/`68.75%`, reveal `20.83%`/`57.29%`,
  `dock-settle 1.6s 8s`, `bob 3.4s 9.6s`; 404 and `/api/health` 200.
- Watch /home: the boat clears the far approach in ~2s, the whole entrance lands at
  ~9.6s. To validate faster-first-leg I can pin the sail clock at 2000ms and confirm
  the boat is already at the second beat.
