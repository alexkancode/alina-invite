# Test Suite Stabilization

## Understanding

Tackle the loose ends flagged during the combobox-selected-state work, scoped to the items
explicitly called out (not the wider repo-wide failing suites):

1. `test-audit.log` is runtime output of the feature-flag tests, yet it is tracked by git, so
   every test run dirties the working tree and pollutes commits.
2. `tests/integration/spotify-only-integration.test.ts` — 10 failures.
3. `tests/integration/spotify-performance.test.ts` — 3 failures.

## Deep-Dive Findings (verified 2026-06-09)

### test-audit.log
`ProductionSafety` (feature-flag claude-skill) appends an audit line on every toggle during
tests. The file is tracked, so test runs mutate it; it slipped into the combobox implementation
commit and had to be amended out.

### spotify-only-integration: the suite mocks an architecture that no longer exists
The route `api/music-search.ts` delegates to the module-level singleton `spotifyMusicService`,
which constructs its `SpotifyClient` once at import time. The suite re-mocks the `SpotifyClient`
constructor per test, but the singleton captured its client before any test ran, so the test
spies are never wired in: searches return `success: true, songs: []` instead of the mocked
results, and the spies record zero calls. Ten tests fail for this single structural reason.

### spotify-performance: one wrong assertion plus its fallout, and one real inefficiency
- "should handle concurrent requests efficiently" expects 5 fetch calls from "retries", but the
  component has never had retry logic; three searches make exactly 3 calls. The test asserts
  imagined behavior.
- "should recover quickly from network errors" passes in isolation. It fails in the full run
  because the concurrent test's failed assertion throws before its `vi.useRealTimers()` line,
  leaking fake timers and queued debounce callbacks into later tests (14 phantom fetch calls).
  The suite has no afterEach timer/fetch hygiene, so one failure cascades.
- "should handle keyboard navigation efficiently on large lists" fails honestly: every ArrowDown
  triggers a full dropdown rebuild (innerHTML wipe, 20 elements recreated, layout recalculated),
  measured at ~413ms for 20 keypresses against a 50ms budget. This is a genuine component
  inefficiency, not a bad test: arrow-key navigation recreates every row and re-fetches album
  art elements when only the highlight class needs to move.

## Agreed Outcome

- `test-audit.log` untracked and gitignored; test runs no longer dirty the tree.
- `spotify-only-integration` rewritten against the real architecture: route-level tests mock
  the `spotifyMusicService` module; service-level behaviors (70s decade query, maxResults
  default, error mapping) are tested on fresh `SpotifyMusicService` instances where per-test
  client mocking actually works.
- `spotify-performance` gets afterEach timer/fetch hygiene so a single failure cannot cascade;
  the concurrent-requests expectation matches real (non-retrying) behavior.
- The combobox reuses dropdown DOM nodes when only the highlight moves, fixing the honest
  performance failure at the component level rather than loosening the test budget.
- Scope guard: `spotify-client.test.ts`, `enhanced-spotify-client.test.ts`, and the other
  repo-wide failing suites stay untouched.

Related docs: [diagrams](./diagrams.md), [implementation plan](./implementation-plan.md).
