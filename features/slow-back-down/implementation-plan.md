# slow-back-down - implementation plan

## Mechanism

`git revert --no-commit c965fb7` (the `global-1-5x-faster implementation` commit).
This restores the exact pre-speedup values across the seven files it touched
(`heroScene.ts`, `yait.css`, and the five test files) with no rounding drift, then
commit as `slow-back-down implementation`.

Reverting only the implementation commit (not its plan commit) leaves the
`features/global-1-5x-faster` docs in history; this `features/slow-back-down` folder
records the reversal.

## What gets restored

- `heroScene.ts`: `SAIL_MS` 8000, `SETTLE_MS` 1600, `REVEAL_DURATION_MS` 9600,
  `WHIP_DURATION_MS` 3333, `BOUNCE_STEP_MS` 90, `LEAN_CYCLE_MS` 4000.
- `yait.css`: `sail-x`/`sail-weave` 8s, `reveal-mask`/`reveal-text` 9.6s,
  `dock-settle 1.6s 8s`, `bob 3.4s 9.6s`, `lean 4s`, `fry-bounce 1.1s`, `cta-rise 0.9s`.
- Tests: canary durations (8s/9.6s) + single-window regex, sail-path reveal duration
  (9600), whip-edge `WHIP.durationMs` (3333), integration whip `dur="3.333s"`, e2e
  pins (`DOCKED_AFTER_MS` 10500, mid-bay 4000, stern 2400/4000/7500, roll-burst 7000).

## PR checklist pass

- Pure revert of a self-contained timing commit; no new code, no inline styles, no
  duplication, no comments. The restored tests already encode the prior timeline.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green
  (these are the exact tests that passed at the pre-speedup commit).
- Local rebuild + redeploy; CURL confirms `sail-x 8s`, `reveal-mask 9.6s`,
  `dock-settle 1.6s 8s`, `bob 3.4s 9.6s`, whip `dur="3.333s"`; old 1.5x values
  (`5.333s`, `6.4s`, `2.222s`) gone; 404 and `/api/health` 200.
- Watch /home: entrance lands at ~9.6s again, whip at 3.33s/cycle. To validate
  slow-back-down I can time the reveal completion (~9.6s) and one whip cycle (~3.33s).
