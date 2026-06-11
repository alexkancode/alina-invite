# Dock Carousel — Implementation Plan

Feature alias: `dock-carousel`

## Step 1 — Attendance summary helper (TDD)

- `tests/unit/guest-list-renderer.test.ts`: `summarizeAttendance` returns going, notGoing,
  and deferred counts for a mixed list (deferred = the existing predicate's subset of
  notGoing).
- `GuestListRenderer.ts`: export the helper built on `isDeferredGuest`.

## Step 2 — Markup and wiring

- `index.astro` dock: Play all, then `.guest-counters` (a span `#guest-going-count` and
  the existing `#guest-notgoing-toggle` button stacked vertically), then
  `#guest-scroll-left`, `#rsvp-guests`, `#guest-scroll-right`.
- `loadGuestList` uses the summary for both labels; the toggle is disabled when
  `deferred === 0` instead of hidden; arrow clicks `scrollBy` plus/minus 80% of the
  scroller's client width (smooth).

## Step 3 — Styles

- `.guest-counters`: flex column, centered, small gap, no shrink.
- `.guest-counter`: shared pill sizing; going variant purple-on-translucent; the toggle
  keeps its purple/magenta pressed styling, plus a disabled state.
- `#rsvp-guests`: single row — nowrap, `overflow-x: auto`, vertical centering, touch
  scrolling; entries `flex: 0 0 auto`. The desktop 30vh vertical cap and the mobile
  25%-entry/140px rules are removed in favor of the row model.
- `.guest-scroll-arrow`: circular button with a CSS-drawn chevron, vertically centered,
  no shrink; hidden when the play-all button is hidden (empty list).

## Step 4 — E2E

- Counters: labels match "Going (N)" / "Not Going (N)" with N consistent with the API
  list; the toggle still reveals a seeded deferred guest (existing test continues).
- Scroller: with the local many-guest dataset, `scrollWidth > clientWidth`, right arrow
  increases `scrollLeft`, left arrow returns it, and the computed `overflow-x` is auto
  (swipe-capable).

## Step 5 — Verify, deploy

- Suites; rebuild/redeploy; screenshots desktop and mobile (idle and after arrow paging);
  prod deploy (marker: `guest-scroll-arrow` in served CSS); live measurements and
  screenshots with the real four-guest dock.

## PR-Readiness Review

- Count logic single-sourced beside the deferred predicate; CSS chevrons follow the
  established no-glyph standard; replaced rules removed rather than overridden; no
  comments; tests at unit and e2e levels.
