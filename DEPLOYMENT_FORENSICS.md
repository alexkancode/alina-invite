# Deployment Forensics - yait Staggered Line Reveal

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- staggered-line-reveal plan
- staggered-line-reveal implementation

## Changes Deployed

1. Each headline line now has its own wavy 45-degree reveal edge: lines wrap in
   per-line clip masks sharing one clipPath whose geometry rescaled to the line
   box (143/143, 4 periods, 12.5px — same angle and wavelength as before). The
   bottom line keeps the stern lock exactly; the top line's keyframes derive via
   staggerRevealEdge (every sweeping waypoint shifted left by 50px = 3.90625
   percent, final waypoint untouched so both lines converge at the settle).
2. Mobile variants derived from the same stagger fraction (about 15px on phones).

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "reveal-mask-top"
(verified absent in the BEFORE check).

## Pre-Deploy Validation

- 104 unit/canary/integration green (stagger derivation invariants for both
  viewports, convergence and advance-only locks, rescaled wave geometry with
  45-degree and matched-wavelength invariants; canary covers all eight reveal
  keyframe blocks and the four animation-name swaps)
- 10 e2e green (new: bottom mask leads top by 42-58px at a pinned mid-sail clock
  and converges to under 2px at settle; clip and stern-lock probes retargeted to
  the per-line masks)
- Frames reviewed at both viewports

## Earlier deployments today

- yait Home Landing: cutover 42s on the /home 404-to-200 sentinel, fully validated.
  Includes db-pool-resilience (idle pg connection loss no longer crashes the
  process). Known issue found after: the sail entrance was visually inert
  (dock-settle backwards fill override).
- yait S-Curve Sail-In: cutover 43s; fixed the inert entrance and shipped the S
  course. Superseded by three-beat-sail.
- yait Three-Beat Sail: cutover 42s; split travel from weave for three felt beats.
- yait Wake Reveal: cutover 32s; boat-synced wipe replaced word timers.
- yait Hull-Locked Reveal (2026-06-11): cutover 53s; bow-locked edge.
- yait Stern-Locked Reveal: cutover 42s; reveal edge moved to the stern (edge and
  stern both 115px at beat 1 on prod).
- yait Staggered Headline: cutover 53s; left-aligned lockup, prod indent 100px.
- yait Slanted Reveal Edge: cutover 42s; prod measured 45 degrees exactly.
- yait Wave Reveal Edge: cutover 52s; one period at 50px, prod-verified.
- yait Wave Reveal Edge two-period retune: cutover 51s; prod-verified.
- yait Wave Reveal Edge four-period retune: cutover 62s; prod-verified.
- yait Wave Reveal Edge eight-period retune: cutover 41s; prod-verified at 25px.
- yait Wave Reveal Edge 12.5px amplitude retune: cutover 122s; prod-verified.
- yait Bezier Wave Edge: cutover 41s; 64 cubics, zero kinks prod-verified.
- yait Symmetric Wave Crests: cutover 71s; perpendicular displacement, worst apex
  offset 0.0px prod-verified.

## Production Validation

- Cutover in 32 seconds (sentinel: reveal-mask-top in the new hashed stylesheet)
- Prod stagger probe: bottom edge leads the top by 48.7px at the 3.0s pinned
  clock (50px spec, sub-2px from rounding and the eased frame), converging to a
  0px gap at settle; screenshot reviewed with the full lockup landed
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
