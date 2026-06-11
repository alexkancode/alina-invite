# Deployment Forensics - Dock Carousel Arrow Visibility

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- dock-carousel: state-aware scroll arrows

## Changes Deployed

1. **State-aware arrows** - hidden entirely when the rail does not overflow; left hidden
   at the start, right hidden at the end; recomputed on scroll and resize via a pure
   exported `arrowVisibility` helper (5 new unit cases) wired to the rail's scroll event

## Pre-Deployment Baseline

- Prod has 5 guests: desktop rail likely does not overflow (expect no arrows); a 390px
  mobile viewport overflows (expect right arrow only at the start)

## Risk Assessment

**Low Risk:** pure visibility logic; arrow paging mechanics unchanged; locked by unit
cases and the updated e2e edge-state walk (start, mid, end, back to start)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod desktop (wide, 5 guests): both arrows hidden
- Prod mobile: right arrow only at start; left appears after scrolling; right disappears
  at the end

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: Validation
**Status:** pending
