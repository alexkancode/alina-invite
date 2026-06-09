# Deployment Forensics - Combobox Selected State and Test Suite Stabilization

## Deployment Details

**Date:** 2026-06-09
**Branch:** main (in sync with origin/main)
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- `19a7b90` - test-suite-stabilization implementation
- `3394022` - test-suite-stabilization plan
- `ccb7cab` - combobox-selected-state implementation
- `2f5ac8b` - combobox-selected-state plan
- `7715fde` - spotify-rsvp-integration-fix implementation
- `114093c` - spotify-rsvp-integration-fix plan

## Changes Deployed

1. **Combobox selected state** - selecting a song renders the song card with an (x) clear
   button in place of the input; blur-race fix so slow clicks select reliably
2. **RSVP JSON contract** - browser and API reunified on JSON; malformed bodies return 400
   instead of 500; song payload validated by `parseRsvpSong`
3. **Single favoriteSong control** - fallback select loses its name on JS enhancement,
   fixing submit-button change detection and saved-RSVP restore
4. **Migration 0008** - adds `song_title`, `song_artist`, `song_year`, `song_spotify_url`,
   `song_spotify_id` columns plus indexes; fully idempotent (IF NOT EXISTS); additive only
5. **Combobox render efficiency** - arrow-key navigation reuses dropdown DOM rows
6. **Test stabilization** - no runtime impact (test files and gitignore only)

## Pre-Deployment Baseline (captured before deploy)

- Production page: 200 in 0.54s
- `/api/rsvp` GET: 200, returns legacy `favorite_song_*` columns (schema pre-0008)
- `/api/music-search?q=abba&maxResults=10`: 200, success true with results
- Known prod schema note: rsvps table has legacy `favorite_song_*` columns from migration
  0005; 0008 adds the new `song_*` columns alongside them; legacy columns remain unused

## Risk Assessment

**Low Risk:**
- Test-only changes, gitignore, feature documentation
- Combobox UI changes (front-end only, progressive enhancement fallback intact)

**Medium Risk:**
- RSVP POST contract change (JSON only): the only known client is index.astro, deployed
  atomically with the API; any third-party multipart caller would start receiving 400
- Migration 0008 on production database (mitigated: idempotent, additive, verified locally)

**High Risk:**
- None identified

## Rollback Plan

1. Check Railway build/deploy logs for errors
2. If the app crashes on migration: 0008 is additive, so rollback of code alone is safe;
   redeploy previous commit `2700e37` via Railway
3. If RSVP submissions fail: verify content-type reaching the API, compare with local smoke

## Success Criteria

- Railway deployment reaches RUNNING; no 502s
- `/api/rsvp` GET returns new `song_*` fields
- JSON POST to `/api/rsvp` succeeds (200) and persists song metadata
- Malformed POST body returns 400, not 500
- Music search continues returning results
- RSVP UI: selecting a song shows the selected card with clear button

## Deployment Process Tracking

### Stage 1: Local Build
**Status:** COMPLETED
**Duration:** 3.4 seconds, no errors (pre-existing TypeScript warnings only)

### Stage 2: Railway Upload
**Status:** COMPLETED
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=43259432-c70a-4e07-9ee3-8667d8894d57&

### Stage 3: Railway Build and Migration
**Status:** COMPLETED
**Result:** Image built and pushed; container started 16:55:59 UTC; migrations ran on boot
("Migrations complete."). Migration 0008 confirmed applied by ground truth: `/api/rsvp` GET
returns the new `song_*` columns. Note: Railway log streaming returned lines out of order
and the explicit "Applying 0008" line was not captured in the stream; column presence and a
successful round-trip write were used as the authoritative verification instead.

### Stage 4: Service Health
**Status:** COMPLETED
**Result:** Page 200 in 0.44s post-deploy; no 502s observed during rollout; previous
deployment served traffic until cutover (new schema marker appeared without downtime)

### Stage 5: API Validation
**Status:** COMPLETED
**Results:**
- GET `/api/rsvp`: 200, rows expose song_title, song_artist, song_year, song_spotify_url,
  song_spotify_id (success criterion met)
- POST malformed body: 400 "Request body must be JSON" (was 500 before this deploy)
- POST missing name: 400 "Name and attendance required"
- POST same-IP update of pre-existing "test" entry: 200 (write path confirmed; no new
  guest rows created, count stayed 4)
- Reversible song-write validation on the "test" entry: song fields persisted to the new
  columns, then reverted to null; guest list unchanged
- Music search: 200 with results at maxResults=10 (the value the UI uses)
- UI in production: selecting a dropdown result renders the selected card with the (x)
  clear button, input wrapper hidden, exactly one form control named favoriteSong

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (no downtime observed)
**API Health:** HEALTHY (200s, sub-second responses)
**Functionality:** VERIFIED against all success criteria

**Known follow-up (pre-existing, not a regression):** Spotify rejects search limit values
above 10 with HTTP 400; the client swallows this into an empty success which the service
caches for 10 minutes. The UI requests 10 so guests are unaffected; the route default of 15
returns empty results for direct API callers. Tracked for a future fix.
