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
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
