# Deployment Forensics - yait SMIL Rolling Waves

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- smil-rolling-waves plan
- smil-rolling-waves implementation

## Changes Deployed

1. Second attempt at rolling waves, opposite mechanism from the reverted one: a
   SMIL animateTransform inside the shared clipPath translates the clip shape
   itself one wavelength along the edge (0.02891, 0.2 box units per 4s, seamless
   loop). No carrier, no counter-translation — the text elements are never
   transformed, so the jitter that sank the first attempt is impossible by
   construction. The clip path regained its sliding margins. CSS untouched.
2. Accepted trades (confirmed): bounded per-frame repaint of the two clipped line
   layers, and the page's first runtime JavaScript — one inline statement removing
   the animation node under prefers-reduced-motion (SMIL ignores the media query).

## Cutover Sentinel

GET https://yait.social/home contains "animateTransform" (verified absent in the
BEFORE check).

## Pre-Deploy Validation

- 112 unit/canary/integration green (margin generator invariants restored, box-unit
  WAVE_ROLL derivation, HTML contract for the SMIL node and reduced-motion script)
- 14 e2e green, including the live-pixel test built from the regression's lesson:
  CSS animations pinned at 3.0s with SMIL running free — edge-region pixels change
  across one real second while a fully-revealed word region is byte-identical (the
  exact two failure modes of the reverted attempt, now both asserted in rendered
  pixels); reduced-motion run asserts the animation node is removed
- Live unpinned capture keyed to the animation clock reviewed: wavy cuts rolling
  through the glyphs mid-reveal

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
- yait Taller Tucked Fries: cutover 82s; prod close-up verified.
- yait Rolling Waves (carrier approach): REGRESSED prod (straight edge, text
  jitter) and was ROLLED BACK in 42s; root causes and the validation gap recorded.

## Final Status Assessment

**Deployment Status:** PENDING
