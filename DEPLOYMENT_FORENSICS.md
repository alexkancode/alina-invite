# Deployment Forensics - Play All Previews

## Deployment Details

**Date:** 2026-06-09
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- play-all-previews implementation (plan was pushed with the previous deploy)

## Changes Deployed

1. **Play All button** on the guest list: plays each RSVP card's preview sequentially in
   DOM order, one at a time; toggles to Stop while running; hidden when no card has a song
2. **`preview-ended` CustomEvents** from `AudioPreviewManager` (reasons: ended, stopped,
   error) driving the new `PlayAllController`; manual interaction aborts the sequence
3. **No API or database changes** - front-end only

## Pre-Deployment Baseline

- Cutover marker: `id="guest-play-all"` appears in the served page HTML of the new version
  (server-rendered button), absent today

## Risk Assessment

**Low Risk:** additive front-end controller and one button; existing playback paths
unchanged in behavior (events are additive); locked by 69 unit/canary/integration tests and
14 e2e tests locally, including a real-time observation of a sequential handoff

**High Risk:** none identified

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Page HTML contains the play-all button (cutover marker)
- With a song card present, clicking Play all puts the first card into the playing state
  and the trigger into the running Stop state; clicking again stops and resets
- Individual card playback and modal previews unchanged

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
