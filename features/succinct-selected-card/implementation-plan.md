# Succinct Selected Card — Implementation Plan

Feature alias: `succinct-selected-card`

## Step 1 — Tests first

- `tests/unit/spotify-selected-state.test.ts`: selecting a track with a verbose title shows
  the succinct title on the card, keeps the verbose title in the dropdown row, keeps the
  full title in the hidden field JSON and the card play button's `data-title`.

## Step 2 — Component

- `SpotifyCombobox.renderTrackContent(track, displayTitle = track.title)`: the visible
  title span renders `displayTitle`; data attributes keep `track.title`.
- `renderSelection` passes `succinctSongTitle(track.title)`; `renderDropdown`/
  `createResultItem` stay on the default.

## Step 3 — Verify, rebuild, redeploy, deploy to prod

- Selected-state, combobox, preview suites; local rebuild/redeploy; UI check selecting a
  verbose track; standard prod deploy with forensics; validate by selecting a remastered
  track in the prod modal (no submit needed - selection is client-side only).

## PR-Readiness Review

- Reuses the existing `songTitle` lib (no duplication); display variation handled by a
  default parameter, keeping `renderTrackContent` single-purpose; no styles or comments;
  tests in the same commit.
