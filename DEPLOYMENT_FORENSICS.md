# Deployment Forensics - yait Rolling Waves ROLLBACK

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- Revert "rolling-waves implementation"

## Changes Deployed

1. ROLLBACK: the rolling-waves change regressed production — the user reported the
   reveal edge rendering as a straight line (the clip not applying in live
   rendering) and the settled text jittering (the carrier/counter pair keeps the
   text layer in perpetual subpixel motion; net-zero mathematically but each layer
   resamples per frame). The clock-pinned validation probes checked attributes and
   computed transforms, not live rendered pixels — the gap this slipped through.
2. The revert restores the static wave exactly as deployed in taller-tucked-fries:
   clip on .line-mask, no carrier or counter layers, no wave-roll keyframes.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home no longer contains
"wave-roll" (present in the broken build; count 0 locally after revert).

## Pre-Deploy Validation

- 111 unit/canary/integration and 12 e2e green on the reverted tree
- Investigation of a correct rolling implementation (animating the clip path
  itself, no counter-translation) to follow separately with live-rendering
  validation before any redeploy

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

## Final Status Assessment

**Deployment Status:** PENDING
