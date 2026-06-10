# Deployment Forensics - Guest List Top Margin Removal

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- full-width-guest-list: remove top margin

## Changes Deployed

1. **Guest list sits higher** - the 2.5rem top margin on `#rsvp-guest-list` is removed so
   the cards follow the main content directly; CSS only

## Pre-Deployment Baseline

- Cutover signal: hashed asset set changes; validation by computed margin-top on the live
  section (currently 40px)

## Risk Assessment

**Low Risk:** one property removed; measured locally at 0px margin and 0px gap to main;
guest-list e2e suite green

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod section computes margin-top 0px; cards visibly closer to the content above

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed e077331..32883a5. Monitoring note: the generic asset-hash poller
false-positived 21 seconds after upload (transient asset-list variance), and validation
initially read the old 40px margin. A precise content marker - grepping the served CSS for
the margin-free `#rsvp-guest-list` rule - confirmed the real cutover minutes later. Future
deploys should marker on rule content, not asset-name hashes.
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=3bc7ab5c-6f71-421c-98cc-7a3489c5608d&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Computed margin-top 0px; gap between main content and the list 0px
- Full-page screenshot: the card row with Play all sits directly beneath the map and RSVP
  buttons

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
