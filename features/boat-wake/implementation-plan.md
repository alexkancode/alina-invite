# boat-wake - implementation plan

## Source

### `src/components/yait/HeroBay.astro`
- Move the `<svg class="reveal-echo">` block out of `.headline-mask` and render it as
  the first child of `.envelope-track` (before `.envelope`, so it sits behind the boat).
- On `.reveal-echo-line`, remove the `<animateTransform type="translate">` (reveal
  sweep). Keep the `<animate attributeName="d">` morph and the mirror-flip group.

### `src/styles/yait.css`
- Rewrite `.reveal-echo` from a headline overlay to a stern-anchored wake: position it
  absolutely against `.envelope-track` at the bottom-left (stern + waterline), wide and
  short (so the whip wave squashes into a shallow trailing ripple). Remove the
  `transform: translateY(100%)` drop. Exact anchor/size tuned by screenshot.
- `.reveal-echo-line` stroke style unchanged.

## Tests (TDD)

### `tests/canary/sail-keyframes.canary.ts`
- Remove the `transform: translateY(100%)` assertion (no longer dropped that way).
- Keep the `reveal-echo-line` stroke assertions.

### `tests/integration/home-page.test.ts`
- The `reveal-echo` markup now sits inside the envelope; assert the
  `data-testid="envelope"` block contains `class="reveal-echo"`.
- The echo path keeps the `<animate attributeName="d">` morph and no longer contains a
  `type="translate"` animateTransform (sweep dropped); still no `clip-path`.

### `tests/e2e.yait-home.test.ts`
- Replace the "dropped below the headline" test: assert `.reveal-echo` is a descendant
  of `[data-testid="envelope"]`, that its bounding-box left tracks the boat (sampled at
  an early sail time vs the docked time, both move together / the echo stays within the
  boat's horizontal span), and that the page has no horizontal/vertical scroll.
- Keep the translucent-white-reveals-nothing computed-style check.

## PR checklist pass

- Markup relocation + one CSS rule rewrite; no new util, no inline styles, no comments,
  no duplicated rules. `revealSweep` still feeds the reveal clip (unchanged). Pinned by
  canary (CSS), integration (markup/anim), and e2e (parentage + travel + no-scroll).

## Validation

- Canary green; rebuild; integration green; e2e green.
- Take down server, rebuild, redeploy; screenshot the hero across sail times and confirm
  the wave rides at the stern/waterline and settles at the dock; CURL `/home`
  (reveal-echo present), `/` (`favoriteSong`), `/api/health` 200, `/homex` 404. Tune the
  anchor/size if the wake reads off.
