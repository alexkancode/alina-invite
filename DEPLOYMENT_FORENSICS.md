# Deployment Forensics - Guest Card Name Size Follow-up

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- guest-card-font-size: names a couple sizes larger

## Changes Deployed

1. **Guest names larger** - desktop 19px to 22px; mobile 13px to 15px; song line unchanged
   at 17px/12px; CSS only

## Pre-Deployment Baseline

- Cutover signal: hashed asset set changes; validation by computed sizes on the live cards

## Risk Assessment

**Low Risk:** two values in existing rules; e2e floor raised to 21px; both widths
screenshot-verified locally with intact ellipsis and art-card layout

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod name computes to 22px desktop / 15px mobile; cards fit cleanly

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 716f37a..9e56ba4; asset set changed 53 seconds after upload; page 200
throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=7c3f98e2-531c-4e8e-a419-30da41cf41dc&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Computed sizes: name 22px desktop / 15px mobile; song line unchanged at 17px/12px
- Screenshot: names are the visual anchor of each card; art card and plain cards fit
  cleanly at both widths

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
