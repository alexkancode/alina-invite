# Succinct Song Title — Implementation Plan

Feature alias: `succinct-song-title`

## Step 1 — Utility (TDD)

- `tests/unit/song-title.test.ts`: table-driven cases — dash qualifiers, parenthesized and
  bracketed qualifiers, stacked qualifiers, year-bearing qualifiers, and the negative set
  (plain titles, legitimate parentheses, titles containing keywords without a separator,
  qualifier-only titles).
- `src/lib/songTitle.ts`: `succinctSongTitle(title: string): string`, pure, no DOM.

## Step 2 — Renderer integration (TDD)

- `tests/unit/guest-list-renderer.test.ts`: a verbose title renders succinct in
  `.guest-song-line` while `data-title` keeps the full string.
- `GuestListRenderer.renderSongRow`: visible span uses `succinctSongTitle`; attributes
  unchanged.

## Step 3 — Verify, rebuild, redeploy, deploy to prod

- Utility, renderer, canary, guest-list e2e suites; local rebuild and redeploy; verify
  against the live "testing music" entry locally is not possible (local DB differs), so
  verify via a locally seeded verbose title and screenshot.
- Standard prod deploy with forensics; cutover by changed asset hash; UI validation against
  the existing organic "testing music" card (Bohemian Rhapsody - Remastered 2011), which
  should display as "♪ Bohemian Rhapsody" with playback still working — no test writes
  needed this time.

## PR-Readiness Review

- Utility home: `src/lib/` as a pure shared module (the modal could adopt it later), not
  buried in the renderer.
- No styles, no comments, no duplication; renderer stays single-purpose, the rule has one
  home. Tests per step; the canary continues to lock the API field contract.
