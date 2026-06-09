# Play All Previews

## Understanding

A "Play all" button on the main-page guest list plays every RSVP card's song preview in
sequence — DOM order, which is visually left-to-right, top-to-bottom — one at a time. Guests
without a song are skipped, as are songs whose preview cannot be resolved. While running, the
button becomes a stop control; pressing it stops playback. If the guest manually stops a
preview or plays a different one mid-sequence, the sequence yields rather than fighting them.

## Idiomatic approach for this codebase

The codebase is vanilla TS with DOM-event composition (bubbling `change` events drive form
detection; `data-preview-state` drives icon CSS). The sequencing follows the same grain:

- `AudioPreviewManager` — the single owner of audio lifecycle — announces completion by
  dispatching a bubbling `preview-ended` CustomEvent on the button it was playing, with
  `detail.reason`: `ended` (audio finished), `stopped` (user or another play took over), or
  `error` (playback failed). The manager stays ignorant of playlists.
- A new `PlayAllController` owns only sequencing: it asks the existing
  `PreviewPlaybackController` to play a card's button, then waits for that button's
  `preview-ended` event. `ended`/`error` advance to the next card; `stopped` means the user
  intervened, so the sequence aborts. A button that never reaches the `playing` state
  (unavailable preview) is skipped immediately.
- No timers, no polling, no global state: completion is observed, not inferred, and the
  one-preview-at-a-time invariant continues to live in exactly one place (the manager).

## Outcome

- "Play all" appears with the guest list when at least one card has a song; hidden otherwise.
- Sequence: resolve-and-play card 1, on natural end advance to card 2, and so on; finishing
  the last card resets the button.
- Pressing the button mid-sequence stops audio and resets; manual interaction with any card
  aborts the sequence gracefully.
- The lazy iTunes resolution and client/server caches are reused untouched — playing all N
  cards costs at most N preview lookups, cached thereafter.

Related docs: [diagrams](./diagrams.md), [implementation plan](./implementation-plan.md).
