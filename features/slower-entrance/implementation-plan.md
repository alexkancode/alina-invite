# slower-entrance - implementation plan

## Source changes

### `src/lib/yait/heroScene.ts`
- `SAIL_MS` 5000 -> 10000
- `SETTLE_MS` 1000 -> 2000
- `REVEAL_DURATION_MS` 6000 -> 12000

`REVEAL_TOP_DELAY_MS` (derived, -> 1073), `SCENE_TIMELINE.bounceStartMs` /
`ctaRiseStartMs` (`SAIL_MS+SETTLE_MS` -> 12000) follow automatically. No other source
constant changes; the fry `--fry-delay` and CTA `--cta-delay` read SCENE_TIMELINE so
they shift to 12s with no edit.

### `src/styles/yait.css`
- `.line-mask` `reveal-mask 6s` -> `12s`
- `.headline-line` `reveal-text 6s` -> `12s`
- `.line-mask-top` and `.line-mask-top .headline-line` `animation-delay: 537ms` -> `1073ms`
- `.envelope-track` `sail-x 5s` -> `10s`
- `.envelope` `sail-weave 5s` -> `10s`; `dock-settle 1s 5s` -> `dock-settle 2s 10s`;
  `bob 3.4s 6s` -> `bob 3.4s 12s` (bob DURATION unchanged at 3.4s per "keep loops";
  only its start shifts to the new dock time)

Idle fry `lean 4s` / `fry-bounce 1.1s` and `cta-rise 0.9s` durations untouched.

## Tests

- `tests/unit/yait/sail-path.test.ts`: `REVEAL_DURATION_MS` -> 12000;
  `REVEAL_TOP_DELAY_MS` -> 1073. The `revealDelayMs(..., 6000)` literal-arg cases stay.
- `tests/unit/yait/hero-scene.test.ts`: SCENE_TIMELINE tests assert INVARIANTS
  (`bounceStartMs === sail+settle`, positivity), not literal values - they stay green
  automatically. No edit needed (verify).
- `tests/canary/sail-keyframes.canary.ts`: literal duration regexes `sail-x 5s`,
  `sail-weave 5s` -> `10s`; `reveal-mask 6s`, `reveal-text 6s` -> `12s`. The
  `animation-delay` assertions use `REVEAL_TOP_DELAY_MS` (auto -> 1073).
- `tests/e2e.yait-home.test.ts`: rescale the time-coupled literals to the 2x timeline
  (animation progress is what these target, so pin times double):
  - `DOCKED_AFTER_MS` 6600 -> 13200; `ROLL_SETTLED_AFTER_MS` 8000 -> 16000
  - mid-bay pin `currentTime = 2500` -> 5000
  - stern samples `1200/2000/3750` -> `2400/4000/7500`
  - independent-lines samples `3000/6000/7000` -> `6000/12000/14000`
  - reveal-roll pin `currentTime = 3000` -> 6000
  - mid-sail screenshot wait `3000` -> 6000

## PR checklist pass

- No new code; only constant/duration values change, beside their existing
  definitions. Derived values stay derived (no hand-forking).
- No inline styles; CSS durations updated in place, no rule duplicated.
- Single purpose preserved; no comments.
- Tests updated to the new timeline; canary keeps CSS and constants in lockstep.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms the served CSS carries `sail-x 10s`,
  `reveal-mask 12s`, `animation-delay: 1073ms`, `dock-settle 2s 10s`, `bob 3.4s 12s`;
  404 and `/api/health` 200.
- Watch /home: boat reaches the dock at ~10s, reveal completes ~12s, bounce/CTA fire
  on landing; idle bob and whip unchanged. To validate slower-entrance I can time the
  reveal completion and confirm it lands near 12s.
