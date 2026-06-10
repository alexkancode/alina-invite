# Deployment Forensics - Guest Card Font Size

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- guest-card-font-size implementation
- guest-card-font-size plan

## Changes Deployed

1. **Larger guest-card text** - desktop name 16px to 19px, song line 16px to 17px; mobile
   overrides 11px/10px to 13px/12px; status mark scales via its em sizing
2. **No API or database changes** - CSS only

## Pre-Deployment Baseline

- Cutover signal: hashed asset set changes
- Validation target: the existing "testing music" art card (computed font sizes, layout)

## Risk Assessment

**Low Risk:** two existing rules and two mobile overrides; e2e size floor locks the change;
layout verified at 1280px and 390px locally including ellipsis behavior

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod card name computes to 19px (13px mobile); song line 17px (12px mobile)
- Cards fit and ellipsize correctly at both widths

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed deae6f1..252c1be; asset set changed 181 seconds after upload; page 200
throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=7f2814a9-c609-48ae-adda-d4cd22e67bcf&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Desktop computed sizes: name 19px, song line 17px; mobile: 13px/12px - exact targets
- Screenshots at both widths: the "testing music" art card and plain cards fit cleanly,
  Bohemian Rhapsody album art visible under the wash with the larger readable text

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
