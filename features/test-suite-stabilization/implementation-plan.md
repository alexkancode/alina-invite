# Test Suite Stabilization — Implementation Plan

Feature alias: `test-suite-stabilization`

## Step 1 — Untrack test-audit.log

- `git rm --cached test-audit.log`, add `test-audit.log` to `.gitignore`.
- No code change: `ProductionSafety` keeps writing it; git stops caring.

## Step 2 — Dropdown highlight navigation reuses DOM (TDD)

Files: `src/components/spotify-combobox/SpotifyCombobox.ts`,
`tests/unit/spotify-selected-state.test.ts` (new describe block)

- New unit test first: with an open dropdown, capture the `li` element references, dispatch
  ArrowDown, assert the same element references are still in the DOM (nodes reused), the
  highlight class moved, and `aria-activedescendant` updated.
- Implementation: `renderDropdown` keeps track of the results array and open state it last
  rendered. When `setState` changes only `highlightedIndex` for the same open results, it
  delegates to `updateHighlight()`, which toggles `spotify-result-highlighted` on the affected
  rows instead of rebuilding. Any change to results, open state, or selection still does the
  full rebuild. `renderSelection` similarly skips DOM work when the selected track it last
  rendered is unchanged.
- Single-purpose check: `renderDropdown` decides rebuild-vs-highlight; `updateHighlight` only
  moves the class; no other behavior changes.

## Step 3 — spotify-performance suite hygiene and honest assertions

File: `tests/integration/spotify-performance.test.ts`

- afterEach: `vi.useRealTimers()` and restore the original `global.fetch`, so an assertion
  failure in one test can never leak fake timers or mocks into the next.
- "concurrent requests": expect 3 fetch calls for 3 searches (the component has no retry
  layer; the old expectation of 5 asserted imagined behavior). Keep asserting that the final
  state reflects the last query's results.
- "keyboard navigation": unchanged budget (50ms); expected to pass once Step 2 lands. If it
  still exceeds the budget after the component fix, the finding goes back in the summary
  rather than silently loosening the threshold.
- "recover from network errors": unchanged; passes once cascade sources are sealed.

## Step 4 — Rewrite spotify-only-integration against the real architecture

File: `tests/integration/spotify-only-integration.test.ts`

- Route-level describe (mocks `../../src/lib/spotifyMusicService.js`):
  - 403 when the musicSearch feature flag is disabled
  - 400 for missing or blank query
  - 200 happy path returns service result verbatim
  - 200 with `success: false` body when the service throws (route catch path)
  - legacy parameters (`includeSpotify`, `spotifyPrimary`, `includeFallback`) are ignored —
    service still called once with only query and maxResults
  - maxResults parsing: explicit value passed through, default 15 when absent
- Service-level describe (mocks `./spotify/client.js`, fresh `SpotifyMusicService` instance
  per test so the constructor picks up the mocked client):
  - appends `year:1970-1979` to the Spotify query
  - filters non-70s tracks from results
  - maps auth, timeout, and generic failures to `success: false` with the service's error shape
  - caches repeated queries (second call served from cache, client called once)
- No new shared utilities; mock helpers stay local to the file.

## Step 5 — Verify, rebuild, redeploy, smoke

- Run the two rewritten suites plus every suite touched by combobox-selected-state, and the
  music-search unit suite to confirm no overlap broke.
- Take down the local deployment, rebuild, redeploy.
- Curl smoke: music-search happy path (`?q=`), missing query 400, RSVP happy/unhappy battery
  from combobox-selected-state to prove no API regressions.
- UI: screenshot the open dropdown mid keyboard navigation to confirm highlight rendering is
  visually unchanged after the DOM-reuse change.

## PR-Readiness Review (plan through the ringer)

- Utility in the wrong home? `updateHighlight` is private to `SpotifyCombobox`, its only user.
  Nothing moved into shared libs.
- Inline styles? None; highlight continues to use the existing class.
- Duplicated utilities? Service tests reuse the service's own types; no parallel mock
  frameworks introduced.
- Duplicated style rules? No style changes at all.
- Testable with interfaces? Service-level tests construct `SpotifyMusicService` directly via
  its existing constructor seam; route tests mock the module boundary the route actually uses.
- Single-purpose functions? Rebuild-vs-highlight decision isolated in `renderDropdown`;
  class toggling isolated in `updateHighlight`.
- Comments? None will be added.
- Full unit and integration tests? Step 2 adds the node-reuse unit test; Steps 3-4 are
  themselves the integration coverage.
