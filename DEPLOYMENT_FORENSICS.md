# Deployment Forensics - yait Staggered Headline

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- staggered-headline plan
- staggered-headline implementation

## Changes Deployed

1. The headline becomes a left-aligned two-line lockup: "You Are" on line one,
   "Invited To" on line two indented exactly 100px (style rule, locked by canary).
   Line structure is data (HEADLINE_LINES in heroScene.ts); words remain .word
   spans so all content assertions hold. Reveal mechanics untouched; with the text
   in the left half of the page the stern passes it earlier, so the previously
   back-loaded tail finishes sooner.

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains
"headline-line-indent" (verified absent in the BEFORE check).

## Pre-Deploy Validation

- 81 unit/canary/integration green (HEADLINE_LINES canary, 100px rule canary);
  8 e2e including a geometric lockup test (line two left = line one left + 100px
  within 5px; first line within the left 200px)
- TDD note: the lockup e2e first compared concatenated textContent and failed
  ("YouAre") because Astro strips inter-element whitespace; assertion corrected to
  compare the word list, which is the real contract
- Frames reviewed desktop and mobile at beats and settle

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
- yait Stern-Locked Reveal: cutover 42s on the translate(-91%) sentinel; reveal
  edge moved to the stern, prod probe showed edge and stern both at 115px at
  beat 1.

## Final Status Assessment

**Deployment Status:** PENDING
