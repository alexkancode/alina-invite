# Song Preview Playback — Implementation Plan

Feature alias: `song-preview-playback`

## Step 1 — iTunes preview service (TDD)

File: `src/lib/itunesPreviewService.ts`, tests: `tests/unit/itunes-preview-service.test.ts`

- `ITunesPreviewService` class plus module singleton `itunesPreviewService` (mirrors the
  `spotifyMusicService` pattern; route tests mock the module, behavior tests construct
  instances — the architecture the stabilization work proved out).
- `findPreview(title, artist): Promise<PreviewMatch | null>` where `PreviewMatch` is
  `{ previewUrl, matchedTitle, matchedArtist }`.
- Queries `https://itunes.apple.com/search` with `term`, `media=music`, `entity=song`,
  `limit=5`; picks the candidate whose artist best token-overlaps the requested artist,
  falling back to the first result; returns null on no results, non-OK response, or fetch
  failure (never throws).
- In-memory TTL cache keyed by normalized `title|artist` so repeated plays of the same song
  cost one upstream call; honors Apple's ~20 req/min informal limit together with lazy
  per-click resolution.

## Step 2 — `/api/preview` endpoint (TDD)

File: `src/pages/api/preview.ts`, tests: `tests/integration/preview-api.test.ts`

- GET only. Gated by the same `musicSearch` feature flag as search (403 when disabled).
- `title` and `artist` query params required and non-blank (400 otherwise).
- Delegates to `itunesPreviewService.findPreview`; responds
  `{ success: true, preview: PreviewMatch }` or `{ success: false, preview: null }`;
  an unexpected service throw maps to the same not-found body, never a 500.
- Route tests mock the service module and flag factory (the proven pattern).

## Step 3 — Client preview resolution and playback control (TDD)

Files: `src/components/spotify-combobox/PreviewResolver.ts`,
`src/components/spotify-combobox/PreviewPlaybackController.ts`,
tests: `tests/unit/spotify-preview-playback.test.ts`

- `PreviewResolver`: fetches `/api/preview`, caches result (including null misses) per track
  id; returns `string | null`; never throws.
- `PreviewPlaybackController`: owns the click flow — busy state while resolving, delegate to
  `AudioPreviewManager.playPreview` on success, mark the button with the unavailable class on
  a miss, stop playback when the playing button is clicked again. One public
  `handlePlayClick(button)` method; `AudioPreviewManager` and `PreviewResolver` injected via
  constructor for testability.
- `renderTrackContent` renders the play button on every row (the `previewUrl` condition goes
  away) carrying `data-track-id`, `data-title`, `data-artist`, and `data-preview-url` when
  already known. The selected card inherits the button through the shared renderer.
- Widget script replaces its inline play-click handling with one controller call.

## Step 4 — Styling

File: `src/components/MusicSearchWidgetDynamic.astro` (existing `is:global` style block)

- `.spotify-preview-unavailable` rule: muted opacity, default cursor, no hover effect.
- Busy state reuses the disabled attribute; no inline styles.

## Step 5 — Contract canary

File: `tests/canary/preview-payload.canary.ts`

- Locks that the route's response shape and the client resolver's expectations both match
  `PreviewMatch` from `itunesPreviewService.ts` — the same cross-boundary drift the RSVP
  JSON bug shipped through.

## Step 6 — E2E

File: `tests/e2e.song-preview.test.ts` (added to playwright testMatch)

- Dropdown rows render play buttons.
- Clicking play transitions the button out of the idle glyph (to pause on success or to the
  unavailable state if iTunes has no match) without console errors.
- Selected card also shows the play button.

## Step 7 — Verify, rebuild, redeploy, smoke

- Full related-suite run plus the canaries.
- Take down local deployment, rebuild, redeploy.
- Curl smoke: preview happy path (known 70s song returns a previewUrl), missing params 400,
  unknown gibberish song success:false, flag-disabled 403 if togglable locally; confirm the
  returned previewUrl itself fetches with HTTP 200 audio content-type.
- UI: screenshots of dropdown rows with play buttons, a playing state, and the selected card;
  DOM grep to confirm button attributes and single rendering path.

## PR-Readiness Review (plan through the ringer)

- Utility in the wrong home? iTunes lookup lives in its own lib service beside
  `spotifyMusicService`; click-flow logic lives in a dedicated controller class, not inflating
  `SpotifyCombobox` or the inline widget script.
- Inline styles? None; one new class rule in the existing global style block.
- Duplicated utilities? The service's TTL cache mirrors the bespoke private cache inside
  `SpotifyMusicService` rather than sharing it; extracting a common cache utility would touch
  deployed search code for no behavioral gain, so the duplication is accepted deliberately and
  noted here.
- Duplicated style rules? Button base styling reuses the existing play-button classes; only
  the unavailable modifier is new.
- Testable with interfaces? Controller takes resolver and audio manager via constructor;
  service is instantiable with injected fetch behavior via mocked global fetch; route mocks
  the module boundary.
- Single-purpose functions? Resolution (resolver), match selection (service), click
  orchestration (controller), audio lifecycle (existing manager) are four separate homes.
- Comments? None will be added.
- Full unit and integration tests? Steps 1-3 are TDD with unit suites; Step 2 is integration;
  Step 5 canary; Step 6 e2e.
