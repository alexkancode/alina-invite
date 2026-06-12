# Deployment Forensics - yait Stern-Locked Reveal

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- stern-locked-reveal plan
- stern-locked-reveal implementation

## Changes Deployed

1. The reveal edge moves from the bow to the stern: HullGeometry.lockVw (0 = stern)
   replaces the bow-width term, so letters appear only where the whole boat has
   passed. Desktop waypoints -131 / -91 / -55 / -39 / 0, mobile -146 / -106 / -70 /
   -54 / 0; the docked remainder (39 percent desktop, 54 percent mobile) sweeps out
   during the settle second, completing as the boat rests (confirmed tradeoff).
2. The e2e geometric lock flips: mask bounding right edge equals the track's
   bounding LEFT edge at three pinned clock times.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "translate(-91%)"
(the 33.33 percent stern waypoint; verified absent in the BEFORE check).

## Pre-Deploy Validation

- 79 unit/canary/integration green; 7 e2e including the stern geometric lock
- TDD caught an arithmetic slip: the mobile dock waypoint was first written -46
  instead of -54; the keyframe canary failed and the stylesheet was corrected
- Frames reviewed: headline hidden behind the hull at beat 1, the tail of "To"
  still emerging behind the docked boat during settle

## Earlier deployments today

- yait Home Landing: cutover 42s on the /home 404-to-200 sentinel, fully validated.
  Includes db-pool-resilience (idle pg connection loss no longer crashes the
  process). Known issue found after: the sail entrance was visually inert
  (dock-settle backwards fill override).
- yait S-Curve Sail-In: cutover 43s; fixed the inert entrance and shipped the S
  course. Superseded by three-beat-sail.
- yait Three-Beat Sail: cutover 42s; split travel from weave for three felt beats.
- yait Wake Reveal: cutover 32s; boat-synced wipe replaced word timers.
- yait Hull-Locked Reveal (2026-06-11): cutover 53s on the reveal-mask-mobile
  sentinel; bow-locked edge with mobile keyframe pair; prod probe showed edge and
  bow both at 422px at beat 1. Bow lock superseded by the stern lock above.

## Production Validation

- Cutover in 42 seconds (sentinel: new hashed stylesheet containing translate(-91%))
- Animation-clock probe on prod at 2.0s (beat 1): mask bounding right edge 115px,
  envelope track bounding left edge 115px — the reveal edge sits exactly at the
  stern; screenshot reviewed
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
