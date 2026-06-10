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
**Status:** COMPLETED
**Result:** Pushed f5bb066..ec7dc13; content marker (`position:fixed` in the served
`#rsvp-guest-list` rule) detected 49 seconds after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=319e97b7-b39f-47ae-8a8a-fa37ce74355e&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Dock computes position fixed, 0px gap to the viewport bottom before and after scrolling,
  141px tall with the current four guests
- Page load 643ms with the deferred guest-list render (art cannot block load)
- Screenshot: slim translucent dock with the cards and Play all pill while content scrolls
  behind it

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
