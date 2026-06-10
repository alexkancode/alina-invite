# Succinct Selected Card

## Understanding

The modal's selected song card shows Spotify's verbose title. It should display the succinct
title via the existing `succinctSongTitle` rule, matching the guest cards. The dropdown rows
stay verbose so guests can distinguish versions while picking, and the full title continues
to be saved with the RSVP and carried in the play button's data attributes for preview lookup.

```mermaid
flowchart LR
    P[dropdown rows] -->|verbose, unchanged| V["Bohemian Rhapsody - Remastered 2011"]
    S[selected card display] -->|succinctSongTitle| C["Bohemian Rhapsody"]
    D[hidden field JSON + data-title] -->|full title, unchanged| K[save and preview lookup]

    style P fill:#1a3a5c,color:#fff
    style V fill:#1a3a5c,color:#fff
    style S fill:#5c4a1a,color:#fff
    style C fill:#1e5c2e,color:#fff
    style D fill:#1a3a5c,color:#fff
    style K fill:#1a3a5c,color:#fff
```

## Outcome

- `renderTrackContent` gains an optional display title (defaulting to the track's full
  title); `renderSelection` passes the succinct form. Dropdown rendering is untouched.
- One shared rule (`src/lib/songTitle.ts`) now serves both surfaces; no duplication.
- Locked by selected-state unit tests asserting succinct display on the card, verbose
  display in the dropdown, and the full title in the hidden field and data attributes.
- Deployed to production once verified locally.
