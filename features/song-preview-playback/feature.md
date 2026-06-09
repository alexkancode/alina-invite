# Song Preview Playback

## Understanding

Each song option in the RSVP modal dropdown (and the selected song card, which shares the same
row renderer) gets a play button that plays a ~30 second audio preview of that song. Clicking
play starts the preview and turns the button into a pause control; clicking again (or the
preview ending, or playing a different song) stops it.

## Investigation Findings (verified live, 2026-06-09)

### Spotify does not provide previews for this app
A direct Spotify Web API search with this app's own credentials returns track objects with no
`preview_url` key at all. Spotify removed 30-second preview URLs from the Web API for apps
without legacy extended access (announced November 27, 2024). The existing pipeline
(`SpotifyClient.transformToSongFormat` maps `preview_url`, the row renderer shows a play button
when `previewUrl` exists, `AudioPreviewManager` plays it, the widget script wires clicks) is
fully built but dormant because the field never arrives.

### iTunes Search API is a viable preview source
- Free, no authentication, JSON over HTTPS.
- Returned working 30s AAC previews for all sampled 70s tracks (Dancing Queen, Stayin' Alive,
  Le Freak).
- Preview audio is served with `access-control-allow-origin: *`, so the browser `Audio`
  element plays it directly with no proxying.
- Informal rate limit of roughly 20 calls/minute means previews must be resolved lazily
  (one lookup per actual play click, cached), not eagerly for every search result.

## Agreed Outcome

- Every dropdown row and the selected card show a play button.
- First play click on a track resolves its preview through a new `/api/preview` endpoint
  (server-side iTunes lookup with best-match selection and caching), then plays it.
- Subsequent plays of the same track reuse the resolved URL without another lookup.
- While resolving, the button shows a busy state; if no preview can be found, the button
  becomes inert and visually muted instead of erroring.
- Playing a second track stops the first (existing `AudioPreviewManager` behavior).
- The endpoint is gated by the same `musicSearch` feature flag as search, validates inputs,
  and never 500s on upstream failure.
- Spotify remains the search source; iTunes is only consulted for preview audio.

Related docs: [diagrams](./diagrams.md), [implementation plan](./implementation-plan.md).
