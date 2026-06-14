# dreamy-clouds - implementation plan

## Source

### `src/lib/yait/heroScene.ts`
- Append two far clouds to `CLOUDS` (ids 5, 6): small `scale` (~0.42-0.46), low
  `opacity` (~0.32-0.34), high in the sky (`baseY` ~78-84), `glow: false`. They become
  the receding parallax plane.

### `src/components/yait/HeroBay.astro`
- Give the hero rim-glow ellipse `class="cloud-glow"` so it can be animated on its own.
  No other markup change (the new clouds render through the existing `CLOUDS.map`).

### `src/styles/yait.css`
- `@keyframes glow-breathe { 0%,100% { opacity: 0.32; transform: scale(1); } 50% {
  opacity: 0.55; transform: scale(1.04); } }` and
  `.cloud-glow { transform-box: fill-box; transform-origin: center; animation:
  glow-breathe 12s ease-in-out infinite; }`. Period 12s differs from every cloud
  breathe so the lit edge and body never pulse in sync.
- Retune existing `.cloud--1..4` sway durations to non-round coprime values
  (29 / 37 / 31 / 41s); bob/breathe already coprime - keep. Add `.cloud--5/6` (small
  `--sway` 16-18px, glacial 71/83s drift, staggered negative delays) and
  `.cloud-inner--5/6` (slow bob/breathe).
- Reduced motion: add `.cloud-glow` to the `animation: none` group (`.cloud` /
  `.cloud-inner` already cover the far clouds).

## Tests (TDD)

- `tests/unit/yait/clouds.test.ts`: assert `CLOUDS` now has a receding plane - at
  least two clouds with `opacity <= 0.4` and `glow === false`, all still in the sky
  band; the single-hero-glow invariant holds.
- `tests/canary/sail-keyframes.canary.ts`: assert the `glow-breathe` keyframe (opacity
  + `scale(1.04)`), the `.cloud-glow` animation, and `.cloud-glow` in the
  reduced-motion group.
- `tests/integration/home-page.test.ts`: served HTML has `class="cloud-glow"` and at
  least 6 cloud groups.
- `tests/e2e.yait-home.test.ts`: cloud count 4 -> 6; a new test confirms the rim-glow
  (`.cloud-glow`) computed opacity changes across a short wait (pulse), and reduced
  motion leaves it static (transform none / animation none).

## PR checklist pass

- Far clouds reuse `buildCloud` + `CLOUDS` (no new generator). One new keyframe + one
  class for the glow; existing per-cloud classes extended. No inline styles, no
  duplication, no comments. Single purpose per keyframe.

## Validation

- `npx vitest run` in-scope green; `npx playwright test e2e.yait-home.test.ts` green.
- Local rebuild + redeploy; CURL confirms `class="cloud-glow"`, the `glow-breathe`
  keyframe, and >= 6 cloud groups; 404 and `/api/health` 200.
- Screenshot the sky over a few seconds and confirm the rim-glow brightens/dims and a
  faint far plane sits behind the hero. To validate dreamy-clouds I can capture two
  frames a few seconds apart and confirm the glow opacity differs while the layout
  stays calm.

## Sources

Smashing Ambient Animations Part 1
(https://www.smashingmagazine.com/2025/09/ambient-animations-web-design-principles-implementation/)
and Part 2
(https://www.smashingmagazine.com/2025/10/ambient-animations-web-design-practical-applications-part2/);
NN/g Animation in UX (https://www.nngroup.com/articles/animation-purpose-ux/);
CSS-IRL Heatwave sun (https://css-irl.info/heatwave-animated-sun-illustration/);
Alistair Shepherd Parallax SVG
(https://alistairshepherd.uk/writing/parallax-svg-landscape-1/); CSS-Tricks SVG shape
morphing - avoided (https://css-tricks.com/svg-shape-morphing-works/).
