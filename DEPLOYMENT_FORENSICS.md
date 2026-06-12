# Deployment Forensics - yait Wave Reveal Edge (four-period retune)

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- wave-reveal-edge: four periods

## Changes Deployed

1. Wave retuned again: four sine periods (four crests, four troughs) at the
   unchanged 25px amplitude; samples raised to 128 keeping 32 per period. Two
   numbers in WAVE_SPEC; the extrema-count test re-derives and now asserts four
   of each.

## Cutover Sentinel

Prod /home HTML contains a mid-path coordinate snippet unique to the four-period
wave (verified absent in the BEFORE check, present locally).

## Pre-Deploy Validation

- 89 unit/canary/integration green; 9 e2e green (amplitude band unchanged)
- Frames reviewed: finer chop through the lockup

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
- yait Wave Reveal Edge two-period retune: cutover 51s; crest +25px / trough
  -25px prod-verified.

## Final Status Assessment

**Deployment Status:** PENDING
