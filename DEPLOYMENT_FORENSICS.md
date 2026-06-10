# Deployment Forensics - Preserve Album Art

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- preserve-album-art implementation
- preserve-album-art plan

## Changes Deployed

1. **Same-track art preservation** - the RSVP conflict update keeps stored
   `song_album_art_url` when the incoming song has the same spotify id and no art;
   different tracks take exactly what was sent; explicit art always wins. Dev in-memory
   fallback mirrors the rule.
2. **No schema changes** - SQL expression only

## Pre-Deployment Baseline

- Prod "testing music" row: attending yes, Bohemian Rhapsody, art currently null (wiped by
  the user's stale-device resubmit that motivated this fix)

## Risk Assessment

**Low Risk:** one COALESCE expression; behavior locked by three integration cases
(keep / replace-with-null on song change / explicit-win) plus the full RSVP suite (40
tests green locally); the original stale-localStorage repro now preserves art end to end

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- After deploy: backfill art on the prod row, then resubmit the same track without art
  flipping attendance - art survives; restore the row to going with song and art

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed b6c6d82..cf5b2da. Server-behavior-only change, so the cutover marker
was the behavior itself: a self-healing poll seeding art and flipping attendance without
art on the test row, succeeding when the art survived - detected 65 seconds after upload
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=f2d98674-3e8a-4eef-8e24-c2649c7b2bc8&

### Stage 2: Behavior Validation and Repair
**Status:** COMPLETED
**Results:**
- The cutover poll itself proved the fix live: same-track no-art resubmit preserved art
- Final state restored: "testing music" going, Bohemian Rhapsody - Remastered 2011 with
  album art, guest count 4; screenshot shows the art card back in the dock
- Locally: 40 integration/API tests green, and the original stale-localStorage Playwright
  repro now ends with the art intact

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
