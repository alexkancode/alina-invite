# Guest Play Icon Centering — Implementation Plan

Feature alias: `guest-play-icon-centering`

## Step 1 — Empirical tuning

- Inject candidate padding compensation into the live page (no rebuild) and capture 6x-zoom
  screenshots of the button until the triangle ink is centered; expected magnitude ~1.5-2px
  upward, ~0.5px leftward based on the measured offset.

## Step 2 — Implementation

- Apply the winning values to the `:global(.guest-song-play)` rule in `index.astro` (and the
  mobile override only if the smaller size needs a different compensation).
- Confirm the pause glyph still sits acceptably with the same compensation, since
  `AudioPreviewManager` swaps `textContent` between the two glyphs.

## Step 3 — Verify

- Rebuild, redeploy locally, recapture zoomed before/after screenshots of idle and playing
  states at desktop and mobile widths; run the guest-list e2e suite; commit.

## PR-Readiness Review

- CSS-only, one existing rule touched; no utilities, markup, comments, or duplication.
- Tests: visual property is locked by the screenshot pass recorded here; behavioral e2e
  suite unchanged and re-run.
