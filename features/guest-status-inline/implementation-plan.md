# Guest Status Inline — Implementation Plan

Feature alias: `guest-status-inline`

## Step 1 — Tests first

- `tests/unit/guest-list-renderer.test.ts`: status assertions change from a status line to an
  inline mark — going renders a check inside the name row, not-going renders an x, no entry
  contains the standalone status texts "Going" / "Not going", and the mark carries the
  existing `guest-status-going` / `guest-status-not-going` class.

## Step 2 — Renderer

- `GuestListRenderer.ts`: `renderStatus` becomes `renderStatusMark` returning the inline mark
  span; the entry template wraps name and mark in a `guest-name-row` flex container and drops
  the status line.

## Step 3 — Styles

- `index.astro`: add `:global(.guest-name-row)` (flex, centered, small gap) and
  `:global(.guest-status-mark)` (non-shrinking) rules; existing status color rules are reused
  by the mark span. No inline styles.

## Step 4 — Verify

- Renderer, canary, and guest-list e2e suites; rebuild, redeploy locally, screenshot the list
  to check the mark's alignment and that entries shortened; then commit.

## PR-Readiness Review

- No new utilities; no duplicated styles (color rules reused); renderer stays a pure
  function; no comments; tests updated in the same commit.
