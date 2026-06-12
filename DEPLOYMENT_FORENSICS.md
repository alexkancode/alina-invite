# Deployment Forensics - yait Hull-Locked Reveal

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- hull-locked-reveal plan
- hull-locked-reveal implementation

## Changes Deployed

1. The reveal edge is now locked to the envelope's bow instead of running ahead
   proportionally: buildRevealEdge takes hull geometry (left percent + width vw,
   desktop 61/24 and mobile 46/52) and emits maskPercent = xVw + left + width - 100
   per track waypoint. The reveal runs 6s (track offsets rescaled by 5/6) so the
   final sliver sweeps out during the dock settle, completing as the boat rests.
   Mobile gets its own keyframe pair swapped in via animation-name in the existing
   media query.
2. New e2e asserts geometrically that the mask's bounding right edge equals the
   envelope track's bounding right edge (within 40px) at three pinned clock times —
   the edge IS the bow by construction, since both layers ride identical segment
   timing and 1 mask percent = 1vw.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "reveal-mask-mobile"
(verified absent in the BEFORE check).

## Pre-Deploy Validation

- 87 unit/canary/integration green (hull-geometry derivation invariants for both
  viewports, keyframe canaries for all four reveal blocks, mobile animation-name
  swap); 7 e2e including the bow-edge geometric lock
- Frames reviewed desktop and mobile at beat 1 / beat 2 / settle: text ends at the
  bow throughout; known inherent quirk: on wrapped mobile lines the wipe reveals
  both lines at the same horizontal edge, so partial glyphs appear mid-sweep

## Earlier deployments today

- yait Home Landing: cutover 42s on the /home 404-to-200 sentinel, fully validated.
  Includes db-pool-resilience (idle pg connection loss no longer crashes the
  process). Known issue found after: the sail entrance was visually inert
  (dock-settle backwards fill override).
- yait S-Curve Sail-In: cutover 43s; fixed the inert entrance and shipped the S
  course. Superseded by three-beat-sail.
- yait Three-Beat Sail: cutover 42s; split travel from weave for three felt beats.
- yait Wake Reveal: cutover 32s on the reveal-mask sentinel; boat-synced wipe
  replaced word timers; prod probe showed mask ratio -0.5652 in lockstep with the
  hull at -52vw. Proportional mapping superseded by the hull lock above.

## Final Status Assessment

**Deployment Status:** PENDING
