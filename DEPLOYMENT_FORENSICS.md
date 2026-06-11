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
**Status:** pending

### Stage 2: Validation
**Status:** pending
