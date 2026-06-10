# Deployment Forensics - Succinct Selected Card

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- succinct-selected-card implementation
- succinct-selected-card plan

## Changes Deployed

1. **Succinct title on the modal's selected card** via the shared `succinctSongTitle` rule;
   dropdown rows stay verbose; the hidden field JSON and play button data attributes keep
   the full title (save and preview lookup unchanged)
2. **No API or database changes** - front-end display only

## Pre-Deployment Baseline

- Cutover signal: hashed asset set changes
- Validation: select a remastered track in the prod modal (client-side only, no submit) and
  confirm the card shows the succinct title while the hidden field keeps the full one

## Risk Assessment

**Low Risk:** a default parameter on the shared row renderer; locked by 18 selected-state
unit tests (verbose handling describe added), full combobox suites, and 9 e2e tests green
locally

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod modal: verbose dropdown rows; succinct selected-card title; full title in the
  hidden field

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed f3d8c06..992f14c; asset set changed 160 seconds after upload; page 200
throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=5aeaf5b8-fbc5-4865-be91-7fe89ccf86db&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (client-side selection only, zero data writes):**
- Dropdown row: "Bohemian Rhapsody - Remastered 2011" (verbose kept)
- Selected card: "Bohemian Rhapsody" (succinct)
- Hidden field JSON title: full verbose string (save contract intact)

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
