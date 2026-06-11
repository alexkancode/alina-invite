# Deployment Forensics - yait Three-Beat Sail

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- three-beat-sail plan
- three-beat-sail implementation

## Changes Deployed

1. The entrance now has exactly three felt slow-points (down-tack turn at 40
   percent, up-tack turn at 75 percent, final ease into the dock) instead of five
   per-keyframe hesitations, and the motion is smoother overall: forward travel
   (sail-x on a new .envelope-track wrapper) and the weave (sail-weave: y, lean,
   scale on the envelope) are split onto separate elements so the side-to-side
   drift never stalls forward progress. Both layers ride easeInOutSine.
2. Path spec is now SAIL_TRACK (4 waypoints = 3 segments, locked by a unit test)
   plus SAIL_WEAVE (apexes aligned to track beats, locked by an alignment test);
   the stylesheet canary parses both keyframe blocks and the easing declarations.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "translate(-52vw)"
(the 40 percent track waypoint; verified absent in the BEFORE check).

## Pre-Deploy Validation

- 64 unit/canary green including the new track/weave invariants and stylesheet
  canary; 8 integration; 6 e2e (mid-bay clock-pinned displacement now reads the
  track wrapper; weave keyframes found in the subtree; compositor guard intact)
- Deterministic frames reviewed at all three beats: down-tack apex as "You" lands,
  up-tack apex on approach, level at the dock

## Earlier deployments today

- yait Home Landing: cutover 42s on the /home 404-to-200 sentinel, fully validated.
  Includes db-pool-resilience (idle pg connection loss no longer crashes the
  process). Known issue found after: the sail entrance was visually inert
  (dock-settle backwards fill override).
- yait S-Curve Sail-In: cutover 43s on the translate(-48vw) sentinel. Fixed the
  inert entrance (fill-mode forwards) and shipped the S course; prod animation-clock
  probe confirmed mid-bay displacement (translateX -614px, translateY +22px at
  2.25s). Superseded by the three-beat restructure above.

## Production Validation

- Cutover in 42 seconds (sentinel: new hashed stylesheet containing translate(-52vw))
- Animation-clock probe on prod at 2.0s (beat 1): track matrix translateX -665.6px,
  exactly -52vw at 1280 wide; weave matrix translateY 22px, scale 1.039 with lean —
  the two layers are split and live; screenshot reviewed
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
