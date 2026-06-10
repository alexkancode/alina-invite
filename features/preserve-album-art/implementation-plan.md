# Preserve Album Art — Implementation Plan

Feature alias: `preserve-album-art`

## Step 1 — Integration tests first

- `tests/integration/rsvp-song-submission.test.ts`:
  - seed an RSVP with song + art; resubmit the same track (same spotifyId) without
    `albumArtUrl` flipping attendance; the list still returns the original art
  - resubmit with a different track without art: the art becomes null (no stale bleed)
  - resubmit the same track WITH new art: the new art wins

## Step 2 — API

- `api/rsvp.ts` ON CONFLICT update:
  `song_album_art_url = COALESCE(EXCLUDED.song_album_art_url, CASE WHEN rsvps.song_spotify_id = EXCLUDED.song_spotify_id THEN rsvps.song_album_art_url END)`
- Dev in-memory fallback mirrors the same rule for parity.

## Step 3 — Verify, deploy, repair

- Run the integration suite plus the RSVP/api suites locally after rebuild/redeploy.
- Prod deploy with forensics; cutover marker: behavior-based (the repair write plus a
  same-track no-art resubmit on the test row proves preservation live).
- Backfill the "testing music" art via the established same-IP write, then prove the fix
  by flipping attendance without art and confirming the art survives — leaving the row
  going, with song and art intact.

## PR-Readiness Review

- One SQL expression plus its dev-fallback mirror; no new utilities or styles; the rule is
  expressed once per storage path; integration tests cover keep/replace/explicit-win;
  no comments.
