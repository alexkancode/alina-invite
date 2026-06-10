# Deployment Forensics - Succinct Song Title

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- succinct-song-title implementation
- succinct-song-title plan

## Changes Deployed

1. **Succinct card titles** - `succinctSongTitle` strips keyword-gated version qualifiers
   ("- Remastered 2011", "(2009 Remaster)", "- Radio Edit", stacked qualifiers) from the
   guest-card display; full titles stay in the DB, data attributes, and the modal picker
2. **No API or database changes** - front-end display only

## Pre-Deployment Baseline

- The organic prod entry "testing music" currently displays
  "♪ Bohemian Rhapsody - Remastered 2011" - it doubles as the live validation target:
  after cutover it should read "♪ Bohemian Rhapsody" with no data writes needed
- Cutover signal: hashed asset set changes

## Risk Assessment

**Low Risk:** pure display function with 25 table-driven unit tests including negative
cases (legitimate parentheses, keyword-bearing titles without separators, qualifier-only
titles); renderer covered by unit and e2e suites

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- "testing music" card displays "♪ Bohemian Rhapsody"
- Its preview still plays (full title intact in data-artist/data-title)
- Clean titles elsewhere unchanged

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
