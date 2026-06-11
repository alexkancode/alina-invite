# Deployment Forensics - Dock Carousel

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- dock-carousel implementation
- dock-carousel plan

## Changes Deployed

1. **Stacked counters** right of the vertical Play all: "Going (N)" (passive) above
   "Not Going (N)" (the reveal toggle, relocated from the floating pill; disabled when
   nothing is hidden); counts single-sourced from a new `summarizeAttendance` helper
2. **Horizontal card rail** - cards render in one swipeable row (overflow-x auto, touch
   scrolling) with CSS-chevron arrow buttons at both edges paging by 80% of the visible
   width; the old wrap/vertical-scroll rules (desktop 30vh cap, mobile 25% entries/140px)
   are removed
3. **No API or database changes**

## Pre-Deployment Baseline

- Cutover marker (content-based): `guest-scroll-arrow` in served CSS

## Risk Assessment

**Low Risk:** layout restructure locked by 10 guest-list e2e (counter accuracy vs the live
API, stacked geometry, arrow paging both directions, toggle reveal, previews, play-all)
plus 21 renderer unit tests

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod dock: Play all, stacked counters Going (4)/Not Going (0) per current data (toggle
  disabled at zero), arrows, single-row cards; swipe scrolling on mobile (overflow-x auto)

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 10e4fae..1b977a5; `guest-scroll-arrow` detected in served CSS 95
seconds after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=2fe226cc-c016-4a7f-b63c-1318e982ebcc&

### Stage 2: Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Counters live: "Going (5)" / "Not Going (0)" - a fifth guest ("banana", with Banana
  Pancakes and album art) RSVP'd organically since the last count, exercising the full
  pipeline in the wild; toggle correctly disabled at zero hidden
- overflow-x auto on the rail (mobile swipe), both arrows visible
- Screenshot: vertical Play all, stacked counter pills, chevrons, art-backed card in the
  single-row rail

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
