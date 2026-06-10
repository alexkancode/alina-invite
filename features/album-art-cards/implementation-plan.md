# Album Art Cards — Implementation Plan

Feature alias: `album-art-cards`

## Step 1 — Carry the art through the save pipeline (TDD)

- `tests/unit/spotify-rsvp-integration.test.ts` / `spotify-selected-state.test.ts`: the
  hidden-field JSON includes `albumArtUrl`.
- `SpotifyCombobox.selectTrack`: add `albumArtUrl` to the serialized object.
- `tests/canary/rsvp-payload.canary.ts`: the exact combobox object round-trips through
  `parseRsvpSong` with `albumArtUrl` intact.
- `src/lib/rsvpSong.ts`: optional `albumArtUrl` on `RsvpSong`, parsed when a string.

## Step 2 — Persistence

- `migrations/0009_add_song_album_art.sql`: `ADD COLUMN IF NOT EXISTS song_album_art_url TEXT`.
- `api/rsvp.ts`: INSERT/UPDATE the new column; list GET selects it; dev fallback mirrors it.
- `tests/integration/rsvp-song-submission.test.ts`: POST with `albumArtUrl` persists and
  the list returns `song_album_art_url`.

## Step 3 — Renderer (TDD)

- `tests/unit/guest-list-renderer.test.ts`: an entry with art gets the `guest-entry-art`
  class and a `--album-art` custom property containing the URL (quotes/escaping covered);
  entries without art have neither.
- `tests/canary/guest-list-payload.canary.ts`: list-API row shape including
  `song_album_art_url` renders the art background.
- `GuestListRenderer`: entry element gains the class and custom property when the field is
  present; URL escaped for the style attribute context.
- `index.astro` style block: one `:global(.guest-entry-art)` rule — white 50% gradient over
  `var(--album-art)`, cover, center.

## Step 4 — E2E

- Extend `tests/e2e.guest-list-preview.test.ts`: seed an RSVP whose song includes an
  `albumArtUrl`; the card carries the art class and a computed background containing the
  URL; a song-less card does not.

## Step 5 — Verify, rebuild, redeploy, deploy to prod

- Full related suites; local rebuild/redeploy (migration applies locally); seed a verbose
  modern song through the real modal flow and screenshot the card for readability of the
  purple text over the white-washed art.
- Prod deploy with forensics: migration 0009 applies on container start (additive,
  idempotent); validate with a reversible test-entry write that includes art, screenshot,
  then revert.

## PR-Readiness Review

- No new utilities; escaping reuses the renderer's existing helper. The custom property on
  the element is data binding; the visual rule lives in the stylesheet (no inline style
  rules). Single-purpose functions preserved (a small `entryStyle`/`entryClass` pair in the
  renderer). Tests at every pipeline stage plus canaries on both contracts; comments: none.
