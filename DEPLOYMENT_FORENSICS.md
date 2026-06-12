# Deployment Forensics - yait Slanted Reveal Edge

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- slanted-reveal-edge plan
- slanted-reveal-edge implementation

## Changes Deployed

1. The reveal boundary tilts to ~45 degrees (top leaning left, bottom leaning
   right, letter bottoms emerge first): a static clip-path polygon on the
   translating mask cuts its top-right corner in by 2.7 headline font-sizes. The
   clip never animates — only translateX does — so the compositor-only guarantee
   is unchanged. The headline font-size clamp is consolidated into one
   --headline-fs custom property consumed by both the font-size rule and the slant
   calc (canary asserts the clamp appears exactly once).

## Cutover Sentinel

The stylesheet referenced by https://yait.social/home contains "clip-path:polygon"
(verified absent in the BEFORE check).

## Pre-Deploy Validation

- 82 unit/canary/integration green (new canary: polygon rule, slant derivation,
  single-clamp consolidation); 9 e2e (new: computed clip-path slant within 25
  percent of the mask's rendered height, keeping the edge in the 39-52 degree
  band; compositor guard still passes — animated properties remain transform and
  opacity only)
- Frames reviewed: the diagonal boundary slices the lockup with the lower line
  leading; settled headline fully visible (the cut corner sits at the viewport's
  right edge, far from the left-aligned text)

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
- yait Staggered Headline: cutover 53s on the headline-line-indent sentinel;
  left-aligned two-line lockup, prod indent measured exactly 100px.

## Final Status Assessment

**Deployment Status:** PENDING
