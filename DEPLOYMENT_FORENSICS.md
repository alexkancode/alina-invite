# Deployment Forensics - yait Symmetric Wave Crests

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- symmetric-wave-crests plan
- symmetric-wave-crests implementation

## Changes Deployed

1. Fixed the leaning crests: the wave now displaces perpendicular to the
   45-degree slant (computed in pixel space against the anisotropic mask box and
   converted back to box fractions per axis) instead of horizontally, so every
   apex is centered between its zero crossings. Generator consumes a merged
   WAVE_GEOMETRY (dims + tuning); cubic Beziers and all tuning unchanged (eight
   periods, 12.5px).

## Cutover Sentinel

Prod /home HTML contains an early-path control-point snippet unique to the
perpendicular-displacement curve (verified absent in the BEFORE check).

## Pre-Deploy Validation

- 91 unit/canary/integration green; new apex-centering test (each apex within 5
  percent of the half-wavelength from its crossings midpoint) failed against the
  old generator and passes now; monotonic-y replaced by monotonic-along-edge
  (perpendicular waves legitimately curl past vertical on steep flanks);
  perpendicular amplitude asserted at exactly 12.5px
- 9 e2e green; frames reviewed: balanced symmetric scallops

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
- yait Bezier Wave Edge: cutover 41s; 64 cubics, zero tangent kinks prod-verified.

## Production Validation

- Cutover in 71 seconds (sentinel: perpendicular-curve control-point snippet in
  prod /home HTML)
- Prod symmetry probe: perpendicular crest +12.5px and trough -12.5px exactly;
  worst apex offset from its crossings midpoint 0.0px against a 25px
  half-wavelength — the lean is fully eliminated; screenshot reviewed
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
