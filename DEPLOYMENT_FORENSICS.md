# Deployment Forensics - yait S-Curve Sail-In

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- s-curve-sail-in plan
- s-curve-sail-in implementation

## Changes Deployed

1. The envelope's entrance is now an S course (seen from above) rendered as a gentle
   zig-zag from our side view: down-tack toward the viewer, up-tack away, straighten
   into the dock, with matching heading leans and a 4 percent near/far scale swell.
   Path lives as typed SAIL_PATH data in heroScene.ts; a canary locks the stylesheet
   keyframes to that spec.
2. Fix shipped inside this change: the v1 entrance never visibly ran in production —
   dock-settle's backwards fill (animation-fill-mode: both during its 5s delay)
   overrode the sail transform from t=0, so the envelope sat docked while the words
   revealed. dock-settle now fills forwards only. A new e2e test pins the animation
   clock mid-sail and asserts real displacement, so this cannot silently regress.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "translate(-48vw)"
(the 45 percent waypoint; absent from the v1 build).

## Pre-Deploy Validation

- 39 unit/canary/integration green (10 new path invariants, 3 stylesheet-spec
  canaries) plus 6 e2e (new: tack keyframes present; mid-sail displacement)
- Deterministic animation-clock screenshots reviewed at enter / down-tack / up-tack
- Local compiled CSS contains the sentinel marker

## Previous deployment (same day): yait Home Landing

Commits: yait-home-landing plan, yait-home-landing implementation,
db-pool-resilience. Cutover 42s on the /home 404-to-200 sentinel; prod curl suite,
Railway logs, and Playwright validation all green. Status: SUCCESSFUL. Known issue
discovered afterward and fixed above: the sail entrance was visually inert.

## Production Validation

- Cutover in 43 seconds (sentinel: new hashed stylesheet containing translate(-48vw))
- Animation-clock probe on prod at 2.25s: matrix translateX -614px, translateY +22px,
  scale 1.039 with lean — the envelope is genuinely mid-bay on the down-tack;
  screenshot reviewed and matches local frames
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
