# Deployment Forensics - yait Independent Line Reveals

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- independent-line-reveals plan
- independent-line-reveals implementation

## Changes Deployed

1. The two headline lines are now fully independent revealing entities (user
   refinement: no convergence). The top line runs the identical sweep as the
   bottom, delayed 537ms — the time equivalent of a 150px average trail
   (revealDelayMs over the 1676.8px / 6s reference sweep). It starts later, trails
   throughout (gap breathes with the eased speed), is still behind when the boat
   docks, and completes its own sweep about half a second after the bottom.
2. The superseded position-shifted top keyframes (which converged at the settle)
   are deleted: four keyframe blocks and the staggerRevealEdge derivation removed;
   the top now shares the bottom's keyframes with only animation-delay rules.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains
"animation-delay:537ms" (verified absent in the BEFORE check).

## Pre-Deploy Validation

- 106 unit/canary/integration green (delay derivation exact and linear; canary
  asserts the -top keyframes stay gone and the two delay rules exist)
- 10 e2e green (independence probe: gap 100-260px mid-sail, over 100px at dock —
  no convergence — and under 2px at 7.0s when both have finished)
- TDD note: one test expectation had an arithmetic slip (1074 vs the correct
  1073 for the doubled trail) — the test was corrected, not the code
- Frames reviewed: the top line's cut clearly behind the bottom's

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
- yait Symmetric Wave Crests: cutover 71s; worst apex offset 0.0px prod-verified.
- yait Staggered Line Reveal: cutover 32s; per-line edges, 48.7px gap converging
  to 0 prod-verified. Convergence superseded by the independent model above.

## Production Validation

- Cutover in 32 seconds (sentinel: animation-delay:537ms in the new hashed
  stylesheet)
- Prod independence probe (after waiting for animations to register; a first
  racing probe read stale identical values and was discarded): gap 202px at the
  3.0s pinned clock, 271px when the boat docks — no convergence — and 0px at 7.0s
  with both sweeps complete; screenshot shows "Invi" leading "Y" mid-sail
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
