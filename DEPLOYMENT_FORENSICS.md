# Deployment Forensics - Dock Carousel Mobile Arrows

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- dock-carousel: hide arrows on mobile

## Changes Deployed

1. **Arrows hidden below 640px** - swipe is the mobile affordance; the state-aware arrows
   remain desktop-only; one media rule

## Pre-Deployment Baseline

- Cutover signal: changed asset set; validation by computed display on the live arrows

## Risk Assessment

**Low Risk:** one CSS media rule; e2e asserts arrows display:none at 390px while the rail
keeps overflow-x auto (11 e2e green)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod mobile: both arrows computed display none, rail still swipe-scrollable; desktop
  behavior unchanged

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: Validation
**Status:** pending
