# Deployment Forensics - Full Width Guest List

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- full-width-guest-list implementation
- full-width-guest-list plan

## Changes Deployed

1. **Guest list spans the full screen** - the section moved out of the 791px-capped `main`
   to a full-width sibling with its own padding and stacking context; cards wrap across
   the whole bottom of the page; Play all stays centered
2. **No API or database changes** - markup move plus one spacing rule

## Pre-Deployment Baseline

- Cutover signal: hashed asset set changes; validation by the list container's computed
  width on the live page (old cap 791px)

## Risk Assessment

**Low Risk:** relocation of a self-contained section whose wiring is all id-based; e2e
width assertion plus the full guest-list suite green locally at both viewports

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod list container width tracks the viewport (greater than 900px at 1280px viewport)
- Cards, art backgrounds, previews, and Play all behave unchanged

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
