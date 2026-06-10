# Vertical Play All — Implementation Plan

Feature alias: `vertical-play-all`

## Step 1 — Test first

- Extend the play-all e2e test: the button's box is taller than wide, its left edge sits
  within the dock's left padding, and the existing toggle assertions continue to pass.

## Step 2 — Styles

- `index.astro`:
  - `#rsvp-guest-list` adds `display: flex; align-items: stretch; gap: 0.75rem` and drops
    its own `overflow-y`/`max-height` scroll duties.
  - `#rsvp-guests` gains `flex: 1; max-height: 30vh; overflow-y: auto` (desktop; the mobile
    media override already caps it at 140px).
  - `.guest-play-all` becomes the vertical pill: `align-self: stretch`, zero margins,
    swapped padding, `writing-mode: vertical-rl`, `transform: rotate(180deg)`.
- Markup unchanged; the hidden state keeps working through the existing `[hidden]` rule.

## Step 3 — Verify, deploy

- Guest-list e2e; rebuild/redeploy locally; screenshots at desktop and mobile, idle and
  running states; prod deploy with the content-based CSS marker; validation by computed
  geometry on the live dock.

## PR-Readiness Review

- CSS-only restructure of three existing rules; no inline styles, comments, or
  duplication; geometry locked by e2e.
