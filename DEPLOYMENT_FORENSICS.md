# Deployment Forensics - Calendar Button Labels

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- calendar-button-labels implementation
- calendar-button-labels plan

## Changes Deployed

1. **Desktop labels** - "Add to Apple Calendar" / "Add to Google Calendar" at 0.85rem,
   single line each (responsive label spans)
2. **Mobile** - buttons side by side with "Apple Cal" / "Google Cal" at 0.7rem; the legacy
   250px min-width rule rescoped to the RSVP button only (it was forcing the pair past the
   viewport edge)
3. **No behavior changes** - hrefs, same-tab Apple navigation, corrected Google times all
   untouched and still e2e-locked

## Pre-Deployment Baseline

- Cutover marker: "Add to Apple Calendar" server-rendered in the page HTML

## Risk Assessment

**Low Risk:** label spans and two style rules; 6 calendar e2e green including single-line
and side-by-side geometry assertions; screenshots verified at both widths

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod HTML carries both label variants; desktop one-line full labels; mobile side-by-side
  short labels within the column

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed e7aa704..ecb33b4; new label text detected in served HTML 78 seconds
after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=19963b9f-8625-493a-acd2-715f74d57904&

### Stage 2: Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Desktop: full "Add to ..." labels visible, single line each, side by side (screenshot)
- Mobile (390px): short "Apple Cal" / "Google Cal" labels, side by side, fully within the
  viewport alongside RSVP, map, and the live dock (screenshot)

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
