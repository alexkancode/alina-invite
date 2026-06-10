# Guest List Bottom Dock — Implementation Plan

Feature alias: `guest-list-bottom-dock`

## Step 1 — Test first

- Extend `tests/e2e.guest-list-preview.test.ts`: the section computes `position: fixed`
  with its bottom edge at the viewport bottom both before and after scrolling to the page
  end; its height stays at or below 40% of the viewport.

## Step 2 — Styles

- `index.astro` `#rsvp-guest-list` rule becomes the dock: fixed, inset-x 0, bottom 0,
  z-index 40, translucent light background with backdrop blur, top padding for the Play all
  pill, `max-height: 34vh`, `overflow-y: auto`.
- New `:global(main)` rule adds bottom padding (30vh) so content scrolls clear.
- Markup unchanged (the section already sits outside `main`).

## Step 3 — Verify, deploy

- Guest-list e2e; rebuild/redeploy locally; screenshots at 1280px and 390px at top and
  bottom of scroll, plus the modal open over the dock; prod deploy with forensics using a
  CSS-content cutover marker (lesson from the margin deploy), validation by computed
  position on the live page.

## PR-Readiness Review

- CSS-only; one rule rewritten, one added; no inline styles, utilities, comments, or
  duplication; e2e assertions are the regression lock; modal layering verified explicitly.
