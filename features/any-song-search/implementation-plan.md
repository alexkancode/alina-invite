# Any Song Search — Implementation Plan

Feature alias: `any-song-search`

## Step 1 — Tests first

- `tests/unit/spotify-music-service.test.ts`: decade assertions become plain-query
  assertions (`searchTracks` called with the query as typed); the 70s-filter expectations
  become pass-through expectations (results of any year survive).
- `tests/integration/spotify-only-integration.test.ts`: same change for the service
  describe (query scoping test and year-filter test); route-level tests unchanged.
- `tests/integration/spotify-accessibility.test.ts`: fixture label text updated for parity.

## Step 2 — Service

- `spotifyMusicService.ts`: `searchMusic` passes the trimmed query straight to
  `searchTracks` and uses the results directly; `filter70sOnly` is deleted.

## Step 3 — Labels

- `MusicSearchWidgetDynamic.astro`: both label occurrences (enabled and flag-disabled
  branches) become "Disco song for the party playlist (optional)".

## Step 4 — Verify, rebuild, redeploy, smoke

- Run the touched suites plus preview/combobox/guest-list suites.
- Rebuild and redeploy locally.
- Curl smoke: a modern song ("Espresso Sabrina Carpenter") returns results with a
  post-2020 year; a 70s song still returns; missing query still 400; flag gate unchanged.
- UI screenshot: new label renders in the modal; pick a modern song end to end (selected
  card, submit enabled).

## PR-Readiness Review

- No new utilities or styles; a deletion plus label text. Single-purpose functions
  preserved (`searchMusic` shrinks). No comments. Tests updated in the same commit; the
  unscoped behavior is locked by the same suites that locked the old behavior.
