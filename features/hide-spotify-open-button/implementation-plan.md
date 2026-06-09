# Hide Spotify Open Button — Implementation Plan

Feature alias: `hide-spotify-open-button`

## Step 1 — Test first

- Update `tests/unit/spotify-selected-state.test.ts`: replace the open-button click test with
  an assertion that no `.spotify-open-button` renders in dropdown rows or the selected card.
- Check other suites for open-button expectations and update them the same way.

## Step 2 — Implementation

- Remove the open-button block from `renderTrackContent` in `SpotifyCombobox.ts`.
- Leave the widget script's open-button click branch untouched (dormant, reversible).

## Step 3 — Verify

- Run the combobox suites and the preview e2e; rebuild, redeploy locally, screenshot a row to
  confirm a single play button with correct spacing; then proceed with the prod deploy.

## PR-Readiness Review

- No new utilities, styles, or comments; a render-only removal.
- Reversal path: restore the markup block (still in git history) — handler is already wired.
- Tests updated in the same commit; no dead assertions left.
