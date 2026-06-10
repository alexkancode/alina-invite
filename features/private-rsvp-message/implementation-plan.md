# Private RSVP Message — Implementation Plan

Feature alias: `private-rsvp-message`

## Step 1 — Tests first

- `tests/integration/rsvp-song-submission.test.ts`: a submitted message is echoed in the
  POST response but absent from every row of the public list GET (no `message` key).
- `tests/canary/guest-list-payload.canary.ts`: the exact-row fixture drops `message`,
  keeping the canary aligned with the real payload.

## Step 2 — Implementation

- `index.astro`: textarea placeholder text.
- `api/rsvp.ts`: remove `message` from the list SELECT and from both dev-fallback list
  shapes (mock rows and the in-memory map). POST response unchanged.

## Step 3 — Verify, deploy

- Integration + canary + RSVP suites; rebuild/redeploy; curl smoke (POST echoes message,
  list rows lack the key); modal screenshot for the new placeholder; prod deploy with the
  server-rendered placeholder text as the cutover marker; prod validation via the same
  curl checks (read-only plus the established reversible write).

## PR-Readiness Review

- Text change plus column removal from three read paths; no new utilities or styles; the
  privacy property is locked by tests at two levels; no comments.
