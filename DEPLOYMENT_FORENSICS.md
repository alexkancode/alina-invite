# Deployment Forensics - yait Open Envelope

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- open-envelope plan
- open-envelope implementation

## Changes Deployed

1. The envelope is now open: a raised back flap points skyward (darker sand inner
   face, the coral wax seal relocated to its tip as a broken seal), the fry people
   stand inside the mouth — layered between the flap (z 0) and the front panel
   (z 2) — and the front panel keeps its seams but drops the center seal. Pure
   markup and style rules; no animation changes (the flap rides the existing bob
   and settle).

## Cutover Sentinel

GET https://yait.social/home contains "envelope-flap" (verified absent in the
BEFORE check).

## Pre-Deploy Validation

- 97 unit/canary green; 10 integration (new: flap present, exactly one seal, DOM
  layering order flap-fries-art); 11 e2e (new: flap top above the fries, flap base
  overlapping the front art, z-index ordering)
- Close-up frame reviewed: flap triangle and tip seal clearly read above the
  crowd; full-page frames at both viewports reviewed

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
- yait Larger Headline: cutover 32s; prod computed 136px at 1280; accepted
  boat-fronts-the-To decision recorded.

## Production Validation

- Cutover in 41 seconds (sentinel: envelope-flap in prod /home HTML)
- Prod probe: flap bounding top above the fries, exactly one seal; close-up
  screenshot reviewed — flap skyward behind the crowd, seal at its tip, fries
  inside the mouth
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
