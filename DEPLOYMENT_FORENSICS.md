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
**Status:** pending

### Stage 2: Behavior Validation and Repair
**Status:** pending
