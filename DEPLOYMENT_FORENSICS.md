# Deployment Forensics - Dock Carousel Arrow Footprint

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- dock-carousel: hidden arrows reserve their footprint

## Changes Deployed

1. **Jitter-free arrows** - state-hidden arrows keep their space via a `guest-arrow-idle`
   class with `visibility: hidden` (the `hidden` attribute could not be used: Tailwind's
   preflight forces `[hidden]` to `display: none !important`); the rail width stays
   constant as arrows appear/disappear. Mobile continues collapsing arrows entirely.

## Pre-Deployment Baseline

- Cutover signal: changed asset set; validation by live measurements

## Risk Assessment

**Low Risk:** class swap plus one rule; e2e asserts the invisible arrow keeps a nonzero
footprint and the rail width varies under 1px across state changes (12 e2e green)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod desktop: hidden arrows occupy space invisibly, rail width constant across scroll
  states; prod mobile: arrows still fully collapsed

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: Validation
**Status:** pending
