# Combobox Selected State

## Understanding

When a guest selects a song from the Spotify search dropdown, the combobox must switch from
its editable text-input state to a selected state: the rendered dropdown item (album art,
"Title - Artist", year) is displayed as the selected option together with an (x) clear button.
Clicking the clear button returns the combobox to its editable input state, empties the stored
value, and focuses the input. The selected song must flow through form change detection, the
RSVP submission, and the database.

## Deep-Dive Findings (verified empirically in the browser via Playwright probe, 2026-06-09)

Four distinct defects combine to produce "selecting a song does nothing":

### 1. Selected-state UI does not exist (the feature gap)
`SpotifyCombobox.selectTrack` only writes plain text ("Title - Artist") into the search input
and JSON into the hidden field. There is no selected-item card and no clear button anywhere in
the codebase. The user perceives no selection feedback.

### 2. Duplicate `name="favoriteSong"` breaks form change detection
The progressive-enhancement fallback `<select name="favoriteSong">` stays in the DOM
(`display:none`) alongside the enhanced `<input type="hidden" name="favoriteSong">`.
`form.elements.namedItem('favoriteSong')` therefore returns a `RadioNodeList`, whose `.value`
is always `""` for non-radio elements. Consequences, all confirmed:
- `getCurrentFormData()` never sees the song, so selecting a song leaves the submit button disabled.
- Restoring a saved RSVP assigns `.value` on a `RadioNodeList`, a silent no-op.

### 3. Blur race silently drops slow clicks
`handleBlur` clears the dropdown 100ms after the input blurs. Mousedown on a result blurs the
input; if mouseup comes later than ~100ms, the result list is destroyed before the click event
fires. Confirmed: a 250ms press-and-hold click leaves the input showing the raw query while the
hidden field still holds the previous selection (state desync).

### 4. Client/server content-type contract mismatch
`index.astro` submits `fetch('/api/rsvp', { headers: {'Content-Type':'application/json'}, body: JSON.stringify(...) })`
but `api/rsvp.ts` calls `request.formData()` outside its try/catch. Confirmed: a browser-style
JSON POST returns HTTP 500; only multipart POSTs succeed. The previous session's curl smoke test
used `-F` (multipart), which is why it passed while the real browser path fails.

## Agreed Outcome

- Selecting a result renders the selected-item card with an (x) clear button in place of the input.
- Clearing restores the editable input, clears the hidden field, and fires change detection.
- Selection survives slow clicks (no blur race).
- Exactly one form control carries `name="favoriteSong"` once JS enhancement runs; the fallback
  select keeps its name only when JS fails (progressive enhancement preserved).
- One submission contract: the browser sends JSON with `favoriteSong` as an object; the API parses JSON.
- Song metadata (title, artist, year, spotifyUrl, spotifyId) persists to the rsvps table.
- Tests exercise the real browser contract so this class of mismatch cannot pass silently again.

Related docs: [diagrams](./diagrams.md), [implementation plan](./implementation-plan.md).
