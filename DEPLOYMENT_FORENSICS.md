# Deployment Forensics - Song Input Placeholder

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- song-input-placeholder implementation
- song-input-placeholder plan

## Changes Deployed

1. **New placeholder** - "Search Spotify for a fun song for the party playlist"
2. **Readable placeholder styling** - dedicated `::placeholder` rule (warm cream, 0.8
   alpha, 0.75em so the full sentence fits the input) replacing the 50%-opacity utility
3. **Visible label removed** - input carries `aria-label` so the accessible name remains;
   the flag-disabled fallback select keeps its label
4. **No API or database changes** - front-end only

## Pre-Deployment Baseline

- Cutover marker: the new placeholder text is server-rendered in the page HTML (verified
  locally: 1 occurrence); absent on prod today

## Risk Assessment

**Low Risk:** markup text and one style rule; accessibility suite updated and green;
combobox e2e suites green locally

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Page HTML contains the new placeholder text and the aria-label; no label element above
  the search input
- Modal shows the readable single-line placeholder fully within the input
- Search, selection, and submit flows unchanged

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
