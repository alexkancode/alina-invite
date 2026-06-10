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
**Status:** COMPLETED
**Result:** Pushed 0cb6aaa..f3367f4; hashed asset set changed 64 seconds after upload;
page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=bbe412e7-dea7-4930-a781-fe4baa91600e&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (via reversible write to the same-IP "test" entry, then reverted):**
- Card song line reads exactly "♪ Dancing Queen" with no artist text
- Preview playback from the card still works (data-artist intact for the lookup)
- Play all button present; screenshot confirms layout
- Test data reverted; guest count unchanged at 4

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
