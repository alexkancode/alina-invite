# Combobox Selected State — Implementation Plan

Feature alias: `combobox-selected-state`

## Approach

Fix the four verified defects in one coherent change set, ordered so each step is
independently testable (TDD: failing test first, then implementation).

## Step 1 — Selected-state rendering in `SpotifyCombobox`

Files: `src/components/spotify-combobox/SpotifyCombobox.ts`,
`src/components/MusicSearchWidgetDynamic.astro`, `src/components/spotify-combobox/types.ts`

- Add a `.spotify-selected-container` element to the widget markup (empty, hidden by default).
- `initializeElements` resolves it alongside the existing required elements.
- Extract the track row markup currently inlined in `createResultItem` into
  `renderTrackContent(track): string` so the dropdown row and the selected card share one
  renderer (no duplicated markup).
- Split `updateDOM` into two single-purpose renderers it delegates to:
  - `renderDropdown()` — current dropdown logic, unchanged behavior.
  - `renderSelection()` — when `state.selectedTrack` is set: hide the input wrapper, render
    the selected card (`renderTrackContent` + an (x) button with `aria-label="Clear selected song"`);
    when null: empty the container, show the input wrapper.
- `selectTrack(track)` stops writing display text into the search input; it clears
  `searchInput.value`, sets the hidden field JSON, updates state, and still dispatches the
  bubbling `change` event. `selectTrack(null)` additionally focuses the restored input.
- The (x) button click calls `selectTrack(null)`.
- Styling via class rules in the widget's existing `<style>` block (`.spotify-selected-card`,
  `.spotify-clear-button`) reusing the dropdown row classes for the card body. No inline styles.

## Step 2 — Kill the blur race

File: `src/components/spotify-combobox/SpotifyCombobox.ts`

- `createResultItem` adds a `mousedown` listener calling `event.preventDefault()` so the input
  never blurs while pressing a result; the existing `click` listener then always fires with the
  list still mounted, regardless of how long the press is held.

## Step 3 — Single `favoriteSong` form control after enhancement

Files: `src/components/MusicSearchWidgetDynamic.astro`, `src/pages/index.astro`

- The enhancement script removes the `name` attribute from the fallback select when it hides it.
  JS-disabled clients keep the named select (progressive enhancement intact).
- The enhancement script assigns the combobox instance to the container element property
  `spotifyCombobox` so the page script can drive restore.
- `index.astro` restore path (`rsvpBtn` click): build the track from `localStorage` data and call
  `container.spotifyCombobox.selectTrack(track)`; fall back to writing the hidden input value
  when the instance is absent. `getCurrentFormData()` keeps using `namedItem`, which now resolves
  to the single named control in both enhanced and non-enhanced modes.

## Step 4 — One submission contract: JSON end to end

Files: `src/pages/index.astro`, `src/pages/api/rsvp.ts`

- Submit handler parses the hidden field's JSON string into an object before building the payload,
  so `favoriteSong` travels as a structured object and `localStorage`/`showRsvpStatus` consume the
  same shape (today `showRsvpStatus` expects an object but would receive a string).
- `api/rsvp.ts` POST reads `await request.json()` inside error handling; malformed bodies return
  400, not 500. `favoriteSong` arrives as an object (no JSON.parse of a field). Non-object or
  field-incomplete `favoriteSong` degrades to null rather than rejecting the RSVP.

## Step 5 — Tests (written first, per step)

- Unit (`tests/unit/spotify-selected-state.test.ts`, jsdom):
  - selecting renders the card with title, artist, year, album art, and the clear button,
    and hides the input wrapper
  - clearing restores the editable input, empties hidden field, focuses input, fires change
  - result item `mousedown` is default-prevented (blur-race regression lock)
  - existing `spotify-rsvp-integration.test.ts` mock DOM gains the selected container and
    updated expectations for input value behavior
- Canary (`tests/canary/rsvp-payload.canary.ts`):
  - compile-time lock that the client payload type (`favoriteSong` object with title, artist,
    year, spotifyUrl, spotifyId) matches what the API handler consumes — the exact contract
    drift that shipped this bug
- Integration (`tests/integration/rsvp-song-submission.test.ts`, rewritten):
  - happy path: browser-real JSON POST → 200, song fields persisted and returned by GET
  - unhappy paths: missing name → 400; malformed JSON body → 400; `favoriteSong` of wrong
    shape → 200 with song fields null
- E2E (`tests/e2e.combobox-selected-state.test.ts`, Playwright):
  - search → click result → selected card visible with clear button → submit enabled →
    submit → 200 → clear button restores input
  - slow click (250ms hold) still selects

## Step 6 — Redeploy and smoke

- Take down the running local server, rebuild, redeploy.
- Curl smoke: JSON happy path, missing-name 400, malformed-body 400, GET list shows song fields.
- Browser screenshot review of editable state, open dropdown, selected card, cleared state;
  DOM fetched via curl and grepped to confirm a single `name="favoriteSong"` control and the
  selected-container placement.

## PR-Readiness Review (plan put through the ringer)

- Utility in the wrong home? `renderTrackContent` lives in `SpotifyCombobox`, its only consumer.
  No new shared utility files.
- Inline styles? New UI styled exclusively by class rules in the widget `<style>` block. The
  widget's pre-existing inline styles are out of scope and left untouched.
- Duplicated utilities? Reuses in-class `escapeHtml`; card markup shares `renderTrackContent`
  with dropdown rows instead of duplicating the template.
- Duplicated style rules? Card body reuses the existing `spotify-result-content` classes; only
  the card frame and clear button get new rules.
- Testable, interfaces where appropriate? Public `selectTrack`/`getState` drive all unit tests;
  the container-element instance property gives the page script and e2e tests a seam; payload
  shape locked by a canary type test.
- Single-purpose functions? `updateDOM` becomes a dispatcher to `renderDropdown` and
  `renderSelection`; selection, clearing, and rendering are separate methods.
- Comments? None will be added.
- Full unit and integration tests? Unit, canary, integration, and e2e enumerated in Step 5,
  written before implementation.
