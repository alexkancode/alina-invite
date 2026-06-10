# Album Art Cards

## Understanding

Guest list cards whose RSVP includes a song display that song's album cover as the card
background, softened by a 50% white overlay so the dark purple text and controls stay
readable. Cards without a song (and entries saved before this feature) keep the current
translucent background.

## Why this needs a pipeline, not just CSS

The album art URL is currently dropped at save time: the combobox writes title, artist,
year, spotifyUrl, and spotifyId into the hidden field, the rsvps table has no art column,
and the list API cannot return what was never stored. The art must travel the whole path:

1. Combobox hidden-field JSON gains `albumArtUrl` (Spotify already supplies it per track).
2. `parseRsvpSong` accepts the optional field.
3. Migration 0009 adds `song_album_art_url` (additive, idempotent).
4. The RSVP API stores and returns it.
5. `GuestListRenderer` paints it behind the entry.

## Overlay implementation

One background on the entry: `linear-gradient(white 50%, white 50%) over the image`, cover,
centered — a single style rule, no extra DOM. The per-entry image URL rides a CSS custom
property set on the entry element (data, not styling; the rule itself lives in the page
style block per the no-inline-styles standard).

## Outcome

- New RSVPs with songs render album-art card backgrounds with readable text.
- Song-less cards unchanged; the pre-existing prod entry shows the plain background until
  resubmitted.
- The full pipeline is locked by combobox unit tests, the payload canary, integration
  tests over the JSON contract, renderer tests, and e2e.
- Deployed to production (migration runs on container start) once verified locally.

Related docs: [diagrams](./diagrams.md), [implementation plan](./implementation-plan.md).
