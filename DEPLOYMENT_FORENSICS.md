# Deployment Forensics - yait Wave Reveal Edge (two-period retune)

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- wave-reveal-edge: two periods at 25px swell

## Changes Deployed

1. The reveal edge wave retuned: two sine periods (two crests, two troughs) at
   25px amplitude each, replacing one period at 50px. Spec consolidated into an
   exported WAVE_SPEC consumed by the generator, component, and tests; samples
   raised to 64 to keep at least 24 per period. A new unit test counts extrema so
   the two-crests/two-troughs shape is asserted, not assumed.

## Cutover Sentinel

Prod /home HTML contains a mid-path coordinate snippet unique to the two-period
wave (path opening is identical to the one-period wave; verified absent in the
BEFORE check, present locally).

## Pre-Deploy Validation

- 89 unit/canary/integration green (extrema-count test added; reference round-trip
  now locks amplitudePx 25, periods 2, samples 64)
- 9 e2e green (amplitude band retuned to 15-35px both signs)
- Frames reviewed: tighter, busier ripple through the lockup

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
- yait Wave Reveal Edge: cutover 52s on the yait-wave-clip sentinel; prod probe
  resolved crest +50px / trough -50px / 285px slant over 287px mask.

## Production Validation

- Cutover in 51 seconds (sentinel: mid-path coordinate snippet of the two-period
  wave in prod /home HTML)
- Prod geometry probe mid-reveal: crest +25px, trough -25px, slant 285px over the
  287px mask — the retuned spec exactly; screenshot shows the tighter double
  ripple slicing the lockup
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
