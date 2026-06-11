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
**Status:** pending

### Stage 2: Validation
**Status:** pending
