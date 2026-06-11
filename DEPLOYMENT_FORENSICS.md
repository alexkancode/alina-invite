# Deployment Forensics - Mobile Top Flow

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- mobile-top-flow implementation
- mobile-top-flow plan

## Changes Deployed

1. **Mobile flow starts at the screen top** - main's mobile top padding 34px to 0, the
   stripe panel's 50px mobile margin to 0 (first content measured at 0px, was 84px)
2. **Dock clearance restored on mobile** - the mobile override that crushed main's bottom
   padding to 34px now provides 200px, so the map scrolls fully clear of the fixed dock
   (local measurement: 135px gap even with oversized test data)
3. **Desktop untouched; CSS only**

## Pre-Deployment Baseline

- Cutover signal: changed asset set; validation by live measurements

## Risk Assessment

**Low Risk:** three values in existing mobile rules; locked by an e2e measurement (top
within 10px, bottom padding at least 180px); 7 calendar e2e green

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod mobile: first content at the viewport top; map bottom above the dock top with the
  real four-guest dock

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 9348574..b8ab0a7; asset set changed 125 seconds after upload; page 200
throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=ea8b4752-7a5f-4e03-bcdf-5b09de4d6034&

### Stage 2: Validation
**Status:** COMPLETED
**Results (live mobile measurements at 390x844, zero data writes):**
- First content at 0px from the viewport top (was 84px)
- main bottom padding 200px; map bottom 541 vs dock top 704 - the map clears the real
  four-guest dock by 163px
- Screenshot: title, subtitle, RSVP, both calendar buttons, and the full map all above the
  dock in one screen

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
