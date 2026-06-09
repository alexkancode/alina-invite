# Guest List Song Preview — Implementation Plan

Feature alias: `guest-list-song-preview`

## Step 1 — Guest list renderer module (TDD)

Files: `src/components/guest-list/GuestListRenderer.ts`,
tests: `tests/unit/guest-list-renderer.test.ts`

- `renderGuestEntries(rsvps: GuestRsvp[]): string` builds the entries HTML the inline script
  currently builds, plus the song additions. `GuestRsvp` types the exact fields the list GET
  returns (`name`, `attending`, `song_title`, `song_artist`, `song_spotify_id`).
- All user-controlled fields HTML-escaped (own small `escapeHtml`/`escapeAttribute`, since the
  combobox's are private class methods and the renderer must work without a combobox on the
  page).
- Entries with both `song_title` and `song_artist` get the song line plus a
  `guest-song-play` button carrying `data-track-id` (spotify id, falling back to a
  name-derived key), `data-title`, `data-artist`, and the idle glyph.
- Entries without a song render the same structure as today, escaped.

## Step 2 — Shared audio manager singleton

Files: `src/components/spotify-combobox/AudioPreviewManager.ts`,
`src/components/MusicSearchWidgetDynamic.astro`

- Export `audioPreviewManager` module singleton; the widget script uses it instead of
  constructing its own. Guest-list playback and modal playback then stop each other through
  the existing one-at-a-time logic. Runtime verification in the browser confirms whether the
  bundler shares the chunk between the two scripts; if it does not, behavior degrades to
  today's independent instances and that result is reported honestly.

## Step 3 — Page wiring

File: `src/pages/index.astro`

- `loadGuestList` imports and uses `renderGuestEntries` (deleting the dead
  `favorite_song_*` template).
- One delegated click listener on `#rsvp-guests` routes `.guest-song-play` clicks to a
  `PreviewPlaybackController` built from `PreviewResolver` and the shared audio manager.
- Style rules for `.guest-song-play` (compact circle, green, hover, unavailable state) go in
  the page's existing style block as class rules. The unavailable state gets its own rule
  here rather than depending on the widget's global rule, since the guest list must render
  correctly even if the search widget is flag-disabled.

## Step 4 — Contract canary

File: `tests/canary/guest-list-payload.canary.ts`

- Feeds the renderer the exact JSON shape the RSVP list GET returns (field names verbatim from
  the route's SELECT) and asserts the song line and play button appear — the drift class that
  silently broke the previous song display.

## Step 5 — E2E

File: `tests/e2e.guest-list-preview.test.ts` (added to playwright testMatch)

- Seeds an RSVP with a song over the JSON API, loads the page, finds that guest's entry with
  the song line and play button.
- Clicking the entry's play button leaves the idle state (pause glyph or muted-unavailable).
- A guest without a song renders without a play button.
- XSS regression: a name with HTML angle brackets renders as text, not elements.

## Step 6 — Verify, rebuild, redeploy, smoke

- Run the new suites plus combobox, preview, and RSVP suites.
- Take down local deployment, rebuild, redeploy.
- Curl smoke: RSVP list returns song fields; preview endpoint happy/unhappy unchanged.
- UI: screenshots of the guest list with and without songs playing; check entry proportions
  (entries are width-capped at 25% on mobile rules) so the song line truncates rather than
  stretching entries; DOM grep for escaped output and button attributes.

## PR-Readiness Review (plan through the ringer)

- Utility in the wrong home? The renderer gets its own guest-list module; preview classes are
  imported from where they live rather than duplicated or prematurely relocated out of
  `spotify-combobox/` (noted: a later move to a neutral `audio-preview/` home would be
  mechanical).
- Inline styles? The existing inline-styled template is replaced by class rules added to the
  page style block; new markup uses classes (`guest-entry`, `guest-song-line`,
  `guest-song-play`).
- Duplicated utilities? A renderer-local escape pair is accepted because the combobox's are
  private and coupling the page renderer to the combobox class for string escaping would be a
  worse dependency; noted for a future shared `escape.ts` if a third caller appears.
- Duplicated style rules? The unavailable-state rule is intentionally duplicated for the
  flag-independence reason in Step 3.
- Testable with interfaces? The renderer is a pure string function; playback reuses the
  already-tested controller; the canary locks the API contract.
- Single-purpose functions? Rendering (module), escaping (helpers), click routing (one
  delegated listener), playback (existing controller).
- Comments? None will be added.
- Full unit and integration tests? Steps 1, 4, 5; plus the untouched existing suites.
