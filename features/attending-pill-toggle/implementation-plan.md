# Attending Pill Toggle — Implementation Plan

Feature alias: `attending-pill-toggle`

## Step 1 — Tests first

- New e2e (guest flow): the pill renders as one control with two halves; clicking
  "Can't make it" checks the no radio and unchecks yes; clicking "I'll be there" flips it
  back; submit enables once name plus a side are set.
- Update existing e2e that used `page.check('input[name="attending"]...')` (hidden inputs
  are not checkable by Playwright) to click the visible pill side instead — closer to real
  guest behavior anyway.

## Step 2 — Markup and styles

- `index.astro` fieldset becomes `.attending-toggle` (flex pill, field background, purple
  border, overflow hidden); each label `.attending-option` (flex-1, centered, 44px min
  height, divider between halves); inputs get `.attending-input` (absolute, opacity 0,
  pointer-events none — still focusable).
- Selection rules via `:has`: first half checked = pink fill with dark text; second half
  checked = magenta fill with white text; `:focus-within`/`:has(:focus-visible)` surfaces
  the pink ring on the pill; hover tint on unselected halves.
- Styles as plain scoped rules in the existing modal style block (static markup, no
  runtime injection).

## Step 3 — Verify, deploy

- e2e suites; rebuild/redeploy; screenshots: unselected, going selected, not-going
  selected, keyboard focus ring; prod deploy with content marker (`attending-toggle` in
  served CSS); client-side modal validation.

## PR-Readiness Review

- CSS-state mechanism, zero new JS; real inputs preserved (no semantics reimplemented);
  colors reuse the modal palette; no comments; behavior locked at the input level by e2e.
