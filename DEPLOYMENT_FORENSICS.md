# Deployment Forensics - iOS Calendar Fix

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- ios-calendar-fix implementation
- ios-calendar-fix plan

## Changes Deployed

1. **Two calendar buttons** - Apple Calendar (same-tab anchor to the generic ics, no JS
   interception) and Google Calendar (plain target=_blank with corrected times
   20260711T200000Z/20260711T230000Z, the wrong New_York ctz removed)
2. **Animation hijack removed** - the preventDefault + delayed window.open handler that
   iOS popup blocking silently killed is deleted
3. **ICS endpoints serve inline** instead of attachment (the iOS 13+ Files dead-end)
4. **Apple-strict ICS validity** - no blank lines, EMAIL alarm replaced by a DISPLAY
   alarm (one week) alongside the existing one-day DISPLAY alarm, TZNAME CST/CDT
5. **No database changes**

## Pre-Deployment Baseline

- Cutover marker: the corrected `dates=20260711T200000Z` parameter server-rendered in HTML

## Risk Assessment

**Low Risk:** validity locked by 18 generator unit tests; headers and button semantics by
5 e2e tests; legacy calendar suite updated and green (26 total)

**Residual:** final confirmation that iOS Safari opens the Calendar preview requires a
physical iPhone (user validation step)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod HTML renders both buttons with correct hrefs; live ics serves text/calendar inline
  with the valid body; Google link opens with correct times

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: Validation
**Status:** pending
