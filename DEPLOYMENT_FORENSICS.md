# Deployment Forensics - Dock Carousel Mobile Arrows

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- dock-carousel: hide arrows on mobile

## Changes Deployed

1. **Arrows hidden below 640px** - swipe is the mobile affordance; the state-aware arrows
   remain desktop-only; one media rule

## Pre-Deployment Baseline

- Cutover signal: changed asset set; validation by computed display on the live arrows

## Risk Assessment

**Low Risk:** one CSS media rule; e2e asserts arrows display:none at 390px while the rail
keeps overflow-x auto (11 e2e green)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod mobile: both arrows computed display none, rail still swipe-scrollable; desktop
  behavior unchanged

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 2556cc3..568640c; asset set changed 125 seconds after upload; page 200
throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=e170a25e-9ae6-46be-affc-26a565e70990&

### Stage 2: Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Prod mobile (390px): both arrows computed display none while the rail stays
  swipe-scrollable (overflow-x auto, scrollWidth exceeds clientWidth)
- Screenshot: clean dock with Play all, stacked counters, and the card rail bleeding into
  the next card - the natural swipe cue

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
