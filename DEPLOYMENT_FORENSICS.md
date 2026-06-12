# Deployment Forensics - yait Wave Reveal Edge (12.5px amplitude retune)

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- wave-reveal-edge: halve amplitude to 12.5px

## Changes Deployed

1. Wave amplitude halved to 12.5px crest/trough; eight periods unchanged. One
   number in WAVE_REFERENCE; e2e amplitude band retuned to 8-18px both signs.

## Cutover Sentinel

Prod /home HTML contains a mid-path coordinate snippet unique to the 12.5px
eight-period wave (verified absent in the BEFORE check, present locally).

## Pre-Deploy Validation

- 89 unit/canary/integration green; 9 e2e green
- Frames reviewed: eight delicate undulations along the cut, much more refined
  than the 25px squiggle

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

## Production Validation

- Cutover in 122 seconds (sentinel: 12.5px-amplitude mid-path coordinate snippet
  in prod /home HTML; slower than the usual ~50s but within normal Railway
  variance, no errors in the rollout)
- Prod geometry probe mid-reveal: crest +13px, trough -13px (12.5 rounded by the
  probe) over the unchanged 285px/287px slant on the served eight-period path
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
