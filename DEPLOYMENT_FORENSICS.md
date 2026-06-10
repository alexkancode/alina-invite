# Deployment Forensics - Guest List Top Margin Removal

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- full-width-guest-list: remove top margin

## Changes Deployed

1. **Guest list sits higher** - the 2.5rem top margin on `#rsvp-guest-list` is removed so
   the cards follow the main content directly; CSS only

## Pre-Deployment Baseline

- Cutover signal: hashed asset set changes; validation by computed margin-top on the live
  section (currently 40px)

## Risk Assessment

**Low Risk:** one property removed; measured locally at 0px margin and 0px gap to main;
guest-list e2e suite green

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod section computes margin-top 0px; cards visibly closer to the content above

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
