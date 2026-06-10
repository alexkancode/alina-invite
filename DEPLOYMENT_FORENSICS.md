# Deployment Forensics - Guest List Bottom Dock

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- guest-list-bottom-dock implementation
- guest-list-bottom-dock plan

## Changes Deployed

1. **Fixed bottom dock** - the guest list is out of the page flow, pinned full-width to the
   viewport bottom (z-40, under the modal's z-50) with a translucent blur backdrop,
   34vh height cap with internal scrolling, and 30vh bottom padding on `main`
2. **Load-blocking fix** - guest list rendering deferred to after the window load event so
   third-party album-art images can never block page load (discovered when Spotify's CDN
   stalled rapid repeated loads and hung the load event with the dock in-viewport)
3. **No API or database changes**

## Pre-Deployment Baseline

- Cutover marker (content-based, per the previous deploy's lesson): the served CSS's
  `#rsvp-guest-list` rule contains `position:fixed`

## Risk Assessment

**Low Risk:** CSS plus a render-timing change; 6 e2e tests green including new fixed/
bottom-anchor/height-cap assertions; modal layering screenshot-verified locally

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod dock computes `position: fixed`, hugs the viewport bottom before and after scroll,
  modal covers it when open, page loads stay fast

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
