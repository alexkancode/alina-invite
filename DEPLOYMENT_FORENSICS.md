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
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
