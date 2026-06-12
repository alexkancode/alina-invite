# Deployment Forensics - yait Larger Headline

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- larger-headline plan
- larger-headline implementation

## Changes Deployed

1. Headline grows ~30 percent on desktop: --headline-fs clamp(2.8rem, 11vw,
   8.5rem) (about 106px to 136px at 1280); mobile floor up slightly (2.6 to
   2.8rem), measured fitting at 385px of 390 with the 100px indent.
2. Wave-clip geometry rederived for the taller line box: 185/185 (45 degrees
   held), 5 periods (wavelength stays ~52px), amplitude and the 537ms independent
   delay unchanged.
3. Confirmed design decision: at the new size the docked envelope fronts most of
   the second line's "To" at rest on desktop; options (move boat, shrink, accept)
   were presented and the user chose to accept — boat as foreground scenery.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains
"clamp(2.8rem, 11vw, 8.5rem)" (verified absent in the BEFORE check).

## Pre-Deploy Validation

- 97 unit/canary/integration green (geometry round-trip, 45-degree invariant,
  wavelength band, single-clamp canary on the new token)
- 10 e2e green; font-ready final frames reviewed at both viewports (an earlier
  thin-font frame was the screenshot tool racing the webfont, not the site)

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
- yait Independent Line Reveals: cutover 32s; 537ms delayed top line, prod gaps
  202px mid-sail / 271px at dock / 0 after both, no convergence.

## Production Validation

- Cutover in 32 seconds (sentinel: the new clamp token in the hashed stylesheet)
- Prod probe: computed headline font-size 136px at 1280 (the 8.5rem cap);
  screenshot reviewed — big lockup, boat fronting the To as accepted
- Live invite page 200 and /api/health ok throughout

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
