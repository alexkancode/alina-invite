# Modal Icon Polish — Implementation Plan

Feature alias: `modal-icon-polish`

## Step 1 — Tests first

- `tests/unit/guest-list-renderer.test.ts`: the card play button carries
  `preview-icon-button`.
- `tests/unit/spotify-selected-state.test.ts`: dropdown-row and selected-card play buttons
  carry `preview-icon-button`; the clear button still exposes its aria-label (unchanged
  accessibility contract).

## Step 2 — Shared styles

- `src/styles/global.css`: `.preview-icon-button` — transparent text, relative position,
  `::before` border-built triangle with the optical x-offset, `[data-preview-state="playing"]`
  gradient-built pause bars; all em-sized (copied semantics from the proven guest rules).
- `index.astro`: strip the icon-drawing declarations from `.guest-song-play` (keep size,
  colors, hover, unavailable); guest renderer adds the shared class.
- `MusicSearchWidgetDynamic.astro` global block: `.spotify-clear-button` text transparent
  plus `::before`/`::after` crossed bars.
- `SpotifyCombobox.renderTrackContent`: play button class gains `preview-icon-button`.

## Step 3 — Verify, deploy

- Unit suites plus combobox/guest e2e; rebuild/redeploy; 6x-zoom screenshots of dropdown
  play, selected-card play, playing state, clear X, and a guest card for parity; prod
  deploy with content marker (`preview-icon-button` in served CSS); client-side modal
  validation, no data writes.

## PR-Readiness Review

- Deduplicates rather than duplicates: one icon rule set serves three surfaces; glyph text
  retained because the state machine reads it (transparent, not removed); no comments;
  wiring locked by unit tests, geometry by the screenshot pass.
