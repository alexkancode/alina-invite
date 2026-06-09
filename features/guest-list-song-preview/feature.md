# Guest List Song Preview

## Understanding

Each guest entry in the RSVP list at the bottom of the main page (going / not going) shows the
guest's chosen favorite song with a small play button that plays the 30-second preview, using
the same lazy iTunes resolution pipeline that the modal dropdown uses. Guests without a song
render exactly as today.

## Findings During Investigation (2026-06-09)

- The guest list already tries to show a song line, but it reads `favorite_song_title` /
  `favorite_song_artist` — the pre-migration-0008 column names. The API returns `song_title` /
  `song_artist`, so the song line has been silently empty since the schema change. This feature
  supersedes that dead code.
- The guest list renderer interpolates `name`, song title, and artist into `innerHTML` without
  HTML escaping — user-controlled strings, a stored XSS vector for every visitor. Fixed as part
  of rewriting the renderer.
- `PreviewResolver`, `PreviewPlaybackController`, and `AudioPreviewManager` are not coupled to
  the combobox: the controller only needs a button carrying `data-track-id`, `data-title`,
  `data-artist`. They are reused as-is.

## Agreed Outcome

- Guest entries with both a song title and artist show the song line plus a compact play
  button; entries without a song are unchanged.
- First play click resolves through `/api/preview` (cached server- and client-side);
  unavailable previews mute the button, identical semantics to the dropdown.
- Entry markup is built by a dedicated, unit-testable renderer module that HTML-escapes all
  user-controlled fields, replacing the inline unescaped template.
- A canary locks the renderer's expectations to the exact field names the RSVP list API
  returns, the same drift class that broke the song line before.
- The shared `AudioPreviewManager` is exported as a module singleton so modal and guest-list
  playback stop each other rather than overlapping.

Related docs: [diagrams](./diagrams.md), [implementation plan](./implementation-plan.md).
