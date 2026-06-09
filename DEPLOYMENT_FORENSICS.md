# Deployment Forensics - Guest List Song Preview

## Deployment Details

**Date:** 2026-06-09
**Branch:** main (in sync with origin/main after push)
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- `a66c0bd` - guest-list-song-preview implementation
- `06c6194` - guest-list-song-preview plan

## Changes Deployed

1. **Guest list song display** - entries with a chosen song show "song - artist" with a
   compact play-preview button, rendered by the new unit-tested `GuestListRenderer` module
2. **Dead code replaced** - the old song line read pre-migration `favorite_song_*` fields
   and had rendered nothing since the schema change; a canary now locks the real field names
3. **Stored XSS fixed** - guest names and song fields are now HTML-escaped in the guest list
   (previously interpolated raw into innerHTML)
4. **Shared audio singleton** - modal and guest-list previews stop each other (verified at
   runtime locally: starting a modal preview resets the list button)
5. **No database migrations** - code-only deploy

## Pre-Deployment Baseline (captured before deploy)

- Production page: 200 in 0.23s
- Page HTML contains 0 occurrences of `guest-song-play` - serves as the cutover marker
- Preview endpoint and RSVP list healthy from the previous deployment

## Risk Assessment

**Low Risk:**
- Client-rendered list changes ship atomically with their styles and script
- Playback reuses the already-deployed preview pipeline; failure mode is a muted button

**Medium Risk:**
- Guest list rendering path fully replaced; a rendering bug would blank the list section
  (mitigated by 9 renderer unit tests, 2 canaries, 4 e2e tests against the real page)

**High Risk:**
- None identified

## Rollback Plan

1. Check Railway build/deploy logs for errors
2. Code-only deploy: redeploy previous commit `cb7f61c` via Railway if needed

## Success Criteria

- Railway deployment reaches RUNNING; no 502s
- Page HTML contains the `guest-song-play` style rules (cutover marker)
- Guest entries with songs show the song line and play button in the production UI
- Clicking an entry's play button reaches the playing or muted state
- Entries without songs render unchanged; XSS probe names render as text
- Modal previews and RSVP submission unchanged

## Deployment Process Tracking

### Stage 1: Local Build
**Status:** pending

### Stage 2: Railway Upload
**Status:** pending

### Stage 3: Railway Build
**Status:** pending

### Stage 4: Service Health
**Status:** pending

### Stage 5: UI Validation
**Status:** pending
