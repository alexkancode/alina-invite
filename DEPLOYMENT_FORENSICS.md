# Deployment Forensics - yait Rolling Waves

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- rolling-waves plan
- rolling-waves implementation

## Changes Deployed

1. The wave crests roll continuously along both reveal edges like ocean swell —
   one wavelength per 4s loop toward the dock, seamless because the pattern is
   periodic. Built as a diagonal clip-slide: the clip path gained one wavelength
   of margin at each end plus a half-box enclosure, a new .wave-carrier layer
   slides it parallel to the edge while the line content counter-translates —
   pure transforms, so the compositor guarantee genuinely holds with the edge in
   motion. Per-line nesting is now mask / wave-carrier / line-counter (reveal
   counter-sweep and the 537ms top delay) / headline-line (roll counter).
2. Reveal timing untouched; reduced motion freezes the wave as before.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "wave-roll"
(verified absent in the BEFORE check).

## Pre-Deploy Validation

- 113 unit/canary/integration green (extended-margin generator invariants,
  zero-phase margin anchors, WAVE_ROLL derivation, keyframe and structure
  canaries)
- 13 e2e green (new: carrier transform changes across a 2s pin while a word's
  rect holds within 0.5px — waves move, text does not; legacy probes updated to
  the carrier clip and central anchors; compositor guard still passes)
- Roll-phase frames reviewed

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
- yait Staggered Line Reveal: cutover 32s; superseded by the independent model.
- yait Independent Line Reveals: cutover 32s; prod gaps 202/271/0, no convergence.
- yait Larger Headline: cutover 32s; prod 136px, accepted overlap decision.
- yait Open Envelope: cutover 41s; raised flap, fries inside, prod-verified.
- yait Open Front V: cutover 52s; V mouth and seal-behind-flap prod-verified.
- yait Taller Tucked Fries: cutover 82s; 78-126px crowd, feet tucked with bounce
  headroom, mobile 0.8 scale, prod close-up verified.

## Production Validation

- Cutover in 42 seconds (sentinel: wave-roll in the new hashed stylesheet)
- Prod roll probe across a 2s clock pin: carrier transform changed while the
  word's position drifted 0.0px — the waves roll, the text holds still
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
