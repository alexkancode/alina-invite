# Guest Card Title Only — Implementation Plan

Feature alias: `guest-card-title-only`

## Step 1 — Tests first

- `tests/unit/guest-list-renderer.test.ts`: song-line assertion becomes title-only and
  explicitly asserts the artist is absent from the visible text while still present in
  `data-artist`.
- `tests/canary/guest-list-payload.canary.ts`: song-line expectation updated the same way.
- `tests/e2e.guest-list-preview.test.ts`: seeded-entry assertion drops the artist.

## Step 2 — Renderer

- `GuestListRenderer.ts` `renderSongRow`: visible span renders the escaped title only;
  data attributes unchanged. The song row still requires both title and artist (the lookup
  needs both), so the render condition stays.

## Step 3 — Verify, rebuild, redeploy, deploy to prod

- Renderer, canary, guest-list e2e suites; local rebuild and redeploy; screenshot the card.
- Standard prod deploy with forensics: server-rendered HTML is unchanged by this feature,
  so the cutover marker is the CSS-bundle-adjacent JS asset; simplest reliable marker is the
  page's hashed `/_astro/` JS bundle name changing AND the seeded-card UI check; use the
  bundle-content grep (title-only string is not greppable, so grep the new guest-list JS
  chunk for the removed " - " template separator absence is brittle — instead validate by
  rendered UI with the reversible test-entry write, with the page's changed asset hash as
  the cutover signal).

## PR-Readiness Review

- A one-line template change in the renderer plus test updates; no new utilities, styles,
  comments, or duplication. Behavior remains locked by the same suites.
