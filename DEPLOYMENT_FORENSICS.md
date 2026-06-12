# Deployment Forensics - yait Wake Reveal

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- wake-reveal plan
- wake-reveal implementation

## Changes Deployed

1. The boat now reveals the headline: the per-word timers are retired and the text
   sits inside a clipping mask whose edge sweeps with the envelope. Mask and inner
   text counter-translate on keyframes derived from SAIL_TRACK (buildRevealEdge:
   same offsets, proportional percents -100 / -56.52 / -17.39 / 0) riding the same
   easeInOutSine curve, so the wipe slows through both tacks with the boat and
   completes exactly at docking. Transform-only; reduced motion shows full text.
2. SCENE_TIMELINE drops the retired word-timer fields; a unit test keeps them
   retired and canaries lock reveal-mask / reveal-text keyframes to REVEAL_EDGE.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "reveal-mask"
(verified absent in the BEFORE check; present in the local build).

## Pre-Deploy Validation

- 69 unit/canary green (reveal-edge derivation invariants, retired-timer guard,
  reveal keyframe canaries); 8 integration; 7 e2e (new: clock-pinned mask ratio at
  beat 1 equals the -56.52 percent waypoint within tolerance)
- Beat frames reviewed: reveal edge tracks the hull through both tacks and slices
  glyphs mid-wipe as a true wipe should

## Earlier deployments today

- yait Home Landing: cutover 42s on the /home 404-to-200 sentinel, fully validated.
  Includes db-pool-resilience (idle pg connection loss no longer crashes the
  process). Known issue found after: the sail entrance was visually inert
  (dock-settle backwards fill override).
- yait S-Curve Sail-In: cutover 43s; fixed the inert entrance and shipped the S
  course. Superseded by three-beat-sail.
- yait Three-Beat Sail: cutover 42s on the translate(-52vw) sentinel; split travel
  from weave for exactly three felt beats; prod probe confirmed both layers live
  (track at -665.6px = -52vw at beat 1). Headline timers superseded by the wake
  reveal above.

## Production Validation

- Cutover in 32 seconds (sentinel: new hashed stylesheet containing reveal-mask)
- Animation-clock probe on prod at 2.0s (beat 1): mask ratio exactly -0.5652 (the
  derived -56.52 percent waypoint) while the boat track reads -665.6px (-52vw) —
  wipe and hull in lockstep; screenshot reviewed and matches local frames
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
