# Not Going Toggle — Implementation Plan

Feature alias: `not-going-toggle`

## Step 1 — Renderer (TDD)

- `tests/unit/guest-list-renderer.test.ts`: classification matrix — going/no-song shown,
  going/song shown, not-going/song shown, not-going/no-song gets `guest-entry-deferred`;
  `isDeferredGuest` predicate covers the same matrix directly.
- `GuestListRenderer.ts`: export `isDeferredGuest(guest)`; entry class includes
  `guest-entry-deferred` when true.

## Step 2 — Dock markup, styles, wiring

- `index.astro`:
  - `<button id="guest-notgoing-toggle" class="guest-notgoing-toggle" hidden>` inside the
    dock section.
  - Rules: `.guest-entry-deferred { display: none }`,
    `#rsvp-guest-list.show-deferred .guest-entry-deferred { display: flex }`, and the
    floating pill (absolute, top edge overlap, right inset, muted purple, pressed state).
  - `loadGuestList` computes `N = rsvps.filter(isDeferredGuest).length`, sets the label
    "Not Going (N)", unhides the button when N > 0; click toggles `show-deferred` on the
    section and `aria-pressed` on the button.

## Step 3 — E2E

- Extend `tests/e2e.guest-list-preview.test.ts`:
  - seed a not-going guest without a song: hidden by default, button shows the count,
    click reveals, click again hides
  - seed a not-going guest WITH a song: visible by default
  - the existing no-song test (attending no) reveals via the toggle before asserting.

## Step 4 — Verify, deploy

- Renderer + canary + guest-list e2e; rebuild/redeploy locally; screenshots of default,
  revealed, and button states; prod deploy with content-based CSS marker
  (`guest-entry-deferred`), validated against the live entries (Dad, Chelsea & Atlas,
  Grandma Debbie are all going, so prod N=0 means the button stays hidden — validated via
  a reversible not-going test write, then reverted).

## PR-Readiness Review

- Predicate lives beside the renderer it classifies for; no duplicated logic (count and
  class share it); CSS visibility, no inline styles; no comments; tests at unit and e2e
  levels.
