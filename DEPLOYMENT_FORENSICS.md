# Deployment Forensics - Not Going Toggle

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- not-going-toggle implementation
- not-going-toggle plan

## Changes Deployed

1. **Dock filtering** - default view shows guests going OR with a song; not-going guests
   without songs carry `guest-entry-deferred` (display none) until revealed
2. **Floating "Not Going (N)" toggle** at the dock's top right; hidden when N=0; toggles a
   `show-deferred` class with aria-pressed state
3. **Shared predicate** - `isDeferredGuest` exported from the renderer drives both the
   entry class and the count label
4. **No API or database changes**

## Pre-Deployment Baseline

- Cutover marker (content-based): served CSS contains `guest-entry-deferred`
- All four current prod guests are going, so N=0 and the button stays hidden by default;
  validation uses a reversible same-IP write flipping "testing music" to not-going without
  a song, then restores the original going + Bohemian Rhapsody + art state

## Risk Assessment

**Low Risk:** render classification locked by a unit test matrix; toggle flow locked by
e2e (hidden by default, count, reveal, re-hide, not-going-with-song visible); play-all
unaffected (deferred guests have no songs by definition)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod with N=0: no toggle visible, all four guests shown
- With the reversible not-going write: guest hidden, toggle shows (1), reveal works,
  restore returns the original state

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 55b4d3f..bf2a157; content marker (`guest-entry-deferred` in served CSS)
detected 80 seconds after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e69d?id=0ed8fa59-b389-4358-9937-bae8360ebd69&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results:**
- N=0 state: toggle hidden, all four guests visible (validated before any writes)
- Reversible flip of "testing music" to not-going without a song: entry hidden (3 of 4
  visible), purple "Not Going (1)" pill appeared at the dock's top right, clicking revealed
  all four with the x mark, aria-pressed true; play-all correctly hid while zero songs
  existed
- Entry restored: attending yes, Bohemian Rhapsody with album art, guest count 4

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
