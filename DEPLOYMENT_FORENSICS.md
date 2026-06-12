# Deployment Forensics - yait Open Front V

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- open-front-v plan
- open-front-v implementation

## Changes Deployed

1. The wax seal tucks behind the flap and rises by half its height (cy 26 to 16,
   drawn before the triangle), peeking over the apex.
2. The front closure seam is removed; the front panel is one path whose top edge
   dips from the corners into a center V (the opened-envelope mouth). An interior
   band (the flap's darker sand) backs the mouth so it never sees through to the
   sky, and the fries seat deeper (bottom 48 percent).

## Cutover Sentinel

GET https://yait.social/home contains the V-mouth path fragment
"M 4 38 L 100 80 L 196 38" (verified absent in the BEFORE check).

## Pre-Deploy Validation

- 109 unit/canary/integration green (new: seal drawn behind the flap path at
  cy 16; old seam absent; V path and interior band present); 11 e2e green
- Close-up frame reviewed: V mouth, crowd inside, seal shoulder above the apex

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
- yait Open Envelope: cutover 41s; raised flap, fries inside, prod close-up
  verified.

## Final Status Assessment

**Deployment Status:** PENDING
