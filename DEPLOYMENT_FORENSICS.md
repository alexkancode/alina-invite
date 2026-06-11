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
**Status:** pending

### Stage 2: Validation
**Status:** pending
