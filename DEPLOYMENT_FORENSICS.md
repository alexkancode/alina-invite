# Deployment Forensics - yait Bezier Wave Edge

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- bezier-wave-edge plan
- bezier-wave-edge implementation

## Changes Deployed

1. The wave generator upgrades from polyline sampling (256 straight segments) to
   cubic Bezier segments built from the sine's analytic tangents (Hermite
   construction, 64 cubics = 8 per period): the edge is C1-continuous — no corner
   joints anywhere — and the emitted path shrinks. Wave tuning unchanged (eight
   periods, 12.5px amplitude, 45-degree stern-locked edge).

## Cutover Sentinel

Prod /home HTML contains an early-path control-point snippet unique to the cubic
curve (verified absent in the BEFORE check, present locally).

## Pre-Deploy Validation

- 90 unit/canary/integration green; new C1-continuity unit test asserts the
  incoming and outgoing tangent at every joint match to 4 decimals; all prior wave
  invariants re-asserted on the cubic anchors
- 9 e2e green (wave probe parser updated to cubic anchors; bands unchanged)
- Frames reviewed

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

## Production Validation

- Cutover in 41 seconds (sentinel: cubic control-point snippet in prod /home HTML)
- Prod curve probe: 64 cubic segments, zero tangent kinks at joints, crest +12.5px
  and trough -12.5px exactly; screenshot reviewed
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
