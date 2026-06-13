# continuous-sail-flow - implementation plan

## CSS (`src/styles/yait.css`) - the only source change

Switch the four entrance animations from per-segment easeInOutSine to linear with an
ease-out only on the final (dock) segment, via per-keyframe `animation-timing-function`:

- Shorthands: `sail-x`, `sail-weave` `... cubic-bezier(0.37, 0, 0.63, 1) both` ->
  `... linear both`. `.headline` / `.reveal-window` (`reveal-text` / `reveal-mask`)
  likewise `... linear both`. (The mobile reveal animation-names are unchanged; they
  inherit the same `linear` shorthand on `.reveal-window` / `.headline`.)
- Final-segment ease-out (decelerate into the dock), added to the keyframe that
  begins the last segment:
  - `sail-x`, `sail-weave`: add `animation-timing-function: cubic-bezier(0.61, 1, 0.88, 1);`
    (easeOutSine) to the `68.75%` keyframe.
  - `reveal-mask`, `reveal-text`, `reveal-mask-mobile`, `reveal-text-mobile`: add the
    same to the `83.33%` keyframe (the settle segment).

Transform values stay first in each keyframe so the canary's `transform:` match is
unaffected; the timing-function declaration follows.

No JS / heroScene change (timing is pure CSS). No new symbols.

## Tests

- `tests/canary/sail-keyframes.canary.ts`: update the timing assertions
  `sail-x 8s cubic-bezier(...) both` -> `sail-x 8s linear both` (and sail-weave,
  reveal-mask, reveal-text). Add an assertion that the dock-arrival segments carry the
  ease-out: the `68.75%` (sail) and `83.33%` (reveal) keyframes include
  `animation-timing-function: cubic-bezier(0.61, 1, 0.88, 1)`. The per-keyframe
  transform-waypoint checks (`expectFrame`) still hold (transform stays first).
- `tests/e2e.yait-home.test.ts`: the stern-locked test samples at 1600/2667/5000ms
  (legs 1-2, linear in both sail and reveal), so edge-tracks-stern holds; re-run to
  confirm. Add a "no pause at the beats" check: pin the sail clock 60ms apart around
  the 25% beat (t=2000ms) and assert the envelope translateX advances by more than a
  small floor (velocity stays non-zero through the beat).
- Unit/integration: unaffected (no constant/markup change).

## PR checklist pass

- Pure CSS timing change; no utilities, no inline styles, no duplication, no comments.
- The canary locks the new timing contract; e2e locks the no-pause behavior.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms served CSS carries `sail-x 8s linear both`,
  `reveal-mask 9.6s linear both`, and the ease-out on the dock segments; 404 and
  `/api/health` 200.
- Watch /home: the boat glides through the beats without stopping and eases into the
  dock. To validate continuous-sail-flow I can sample the boat position at closely
  spaced times across a beat and confirm it keeps moving (no velocity dip to zero).
