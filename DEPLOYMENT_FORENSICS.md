# Deployment Forensics - Song Preview Playback

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
4. **No database migrations** - code-only deploy

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
**Status:** pending

### Stage 2: Railway Upload
**Status:** pending

### Stage 3: Railway Build
**Status:** pending

### Stage 4: Service Health
**Status:** pending

### Stage 5: API and UI Validation
**Status:** pending
