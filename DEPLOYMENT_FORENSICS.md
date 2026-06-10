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
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
