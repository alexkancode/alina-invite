# Deployment Forensics - yait Taller Tucked Fries

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- taller-tucked-fries plan
- taller-tucked-fries implementation

## Changes Deployed

1. Fry crowd 50 percent taller (FRY_HEIGHT_RANGE 52-84 to 78-126) and seated
   deeper (fries baseline bottom 48 to 30 percent) so feet stay hidden behind the
   front V with full bounce-amplitude headroom.
2. Mobile keeps proportion via a media-query height scale (0.8) — at fixed pixel
   heights the tall fries reached 89 percent of the smaller envelope and buried
   the flap; the scale was the pre-authorized fallback in the confirmed plan.

## Cutover Sentinel

Prod /home HTML contains a three-digit --fry-h value (impossible under the old
84px cap; verified absent in the BEFORE check).

## Pre-Deploy Validation

- 111 unit/canary/integration green (height range numerically locked; mobile
  scale rule canary-locked); 12 e2e green (new geometric tuck assertion: fries
  baseline minus max bounce amplitude stays below the front V dip — failed at the
  old seating, passes now)
- Close-up and full frames reviewed at both viewports

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
- yait Open Front V: cutover 52s; V mouth, seal behind the flap tip, interior
  band, prod close-up verified.

## Production Validation

- Cutover in 82 seconds (sentinel: three-digit --fry-h in prod /home HTML)
- Prod probe: flap above the fries, one seal; close-up screenshot reviewed —
  taller crowd seated deep with no feet visible below the V
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
