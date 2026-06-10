# Deployment Forensics - Guest Card Title Only

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- guest-card-title-only implementation
- guest-card-title-only plan

## Changes Deployed

1. **Title-only song line on guest cards** - "song - artist" becomes just the song title;
   the artist stays in the play button's data attributes so preview lookup is unchanged
2. **No API or database changes** - front-end renderer text only

## Pre-Deployment Baseline

- The change is client-rendered, so cutover is detected by the page's hashed `/_astro/`
  JS asset names changing from the current set; final verification is by rendered UI via
  the reversible test-entry write

## Risk Assessment

**Low Risk:** one template line in the renderer; locked by renderer unit tests, the
payload canary, and the guest-list e2e suite (all green locally)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Guest card with a song shows "♪ <title>" with no artist text
- Preview playback from the card still works (artist still feeds the lookup)
- Test entry reverted after validation

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
