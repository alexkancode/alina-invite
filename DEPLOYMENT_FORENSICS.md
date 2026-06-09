# Deployment Forensics - Song Preview Playback and Hidden Spotify Open Button

## Deployment Details

**Date:** 2026-06-09
**Branch:** main (in sync with origin/main)
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- `b35d2fb` - song-preview-playback implementation
- `d2d8944` - song-preview-playback plan

## Changes Deployed

1. **`/api/preview` endpoint** - lazy iTunes Search API lookup for 30s song previews,
   musicSearch-flag gated, validated params, in-memory cache, never 500s on upstream failure
2. **Play button on every dropdown row and the selected card** - resolves the preview on
   first click, plays via the existing AudioPreviewManager, mutes the button when no
   preview exists
3. **Click-bubbling guard** - play and open-in-Spotify clicks no longer select the track
4. **Open-in-Spotify button hidden** - no longer rendered in rows or the selected card;
   widget handler kept dormant for easy restoration (hide-spotify-open-button)
5. **No database migrations** - code-only deploy

## Pre-Deployment Baseline (captured before deploy)

- Production page: 200 in 0.36s
- `/api/preview`: 404 (endpoint does not exist yet) - serves as the cutover marker
- RSVP and music-search endpoints healthy from the previous deployment

## Risk Assessment

**Low Risk:**
- New endpoint is additive; nothing existing calls it until the new front end loads
- Front-end changes ship atomically with the endpoint
- iTunes lookups are lazy (per play click) and cached, staying far under Apple's
  ~20 requests/minute informal limit

**Medium Risk:**
- New outbound dependency from the prod container to itunes.apple.com; degraded behavior
  is a muted play button, not an error

**High Risk:**
- None identified

## Rollback Plan

1. Check Railway build/deploy logs for errors
2. Code-only deploy: redeploy previous commit `7fa1950` via Railway if needed
3. If iTunes is unreachable from Railway, buttons degrade to the muted state; no rollback
   required for that alone

## Success Criteria

- Railway deployment reaches RUNNING; no 502s
- `/api/preview?title=Dancing%20Queen&artist=ABBA` returns success true with a previewUrl
  that itself fetches as audio
- Missing-param request returns 400
- Unknown song returns success false, not an error
- Dropdown rows render play buttons in production UI; clicking one reaches the playing or
  muted state without selecting the track
- Previous functionality (RSVP submit, search, selected card) unchanged

## Deployment Process Tracking

### Stage 1: Local Build
**Status:** COMPLETED (no errors; pre-existing TypeScript warnings only)

### Stage 2: Railway Upload
**Status:** COMPLETED
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=e917ccd4-dd2a-4ea0-8786-ff5aa77dc3f3&

### Stage 3: Railway Build
**Status:** COMPLETED (image built and pushed, no errors in build log)

### Stage 4: Service Health
**Status:** COMPLETED
**Result:** Cutover detected 148s after upload (`/api/preview` flipped 404 to 200); page
served 200 throughout; no 502s observed

### Stage 5: API and UI Validation
**Status:** COMPLETED
**Results:**
- Preview happy path: 200, ABBA Dancing Queen previewUrl returned; the audio URL itself
  fetched 200 audio/x-m4p, 1.1MB
- Missing params: 400 "Title and artist are required"
- Unknown song: 200 success false (no error surface)
- Regressions: RSVP GET 200 with song fields; music search 200 with results
- Production UI: 10 dropdown rows, 10 play buttons, 0 open-in-Spotify buttons; clicking
  play reached the pause state (audio playing) without selecting the track;
  screenshot-verified identical to local

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (no downtime observed)
**Functionality:** VERIFIED against all success criteria

Deployed commits also included `hide-spotify-open-button` (plan d1+, implementation in
`5f6123c` push set) alongside `song-preview-playback`.
