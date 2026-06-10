# Deployment Forensics - Vertical Play All

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- vertical-play-all implementation
- vertical-play-all plan

## Changes Deployed

1. **Vertical Play all pill** on the dock's left edge: the dock is a flex row, the button
   stretches the dock height with 90-degree rotated text (vertical-rl + rotate 180), and
   the card area takes the remaining width with its own internal scroll
2. **No API or database changes** - CSS only

## Pre-Deployment Baseline

- Cutover marker (content-based): the served CSS's `.guest-play-all` rule contains
  `writing-mode:vertical-rl`

## Risk Assessment

**Low Risk:** three rules restructured; geometry locked by e2e (taller than wide, left
inset); toggle behavior unchanged and re-verified

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod button renders vertical on the dock's left edge in idle and running states; cards
  clear it; play-all toggle works

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 1da6d1d..0349270; content marker (`writing-mode:vertical-rl` in served
CSS) detected 96 seconds after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=e29153ce-4fed-4ddf-8c21-968585fdbfa5&

### Stage 2: UI Validation
**Status:** COMPLETED
**Results (zero data writes):**
- Button geometry on prod: 27px wide x 86px tall, 24px inset from the dock's left edge,
  computed writing-mode vertical-rl
- Toggle verified live: clicking entered the running state (magenta vertical Stop pill,
  first card playing), screenshots captured for idle and running
- Cards flow cleanly to the right of the pill

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
