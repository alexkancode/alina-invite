# Deployment Forensics - yait Perceptible Wave Roll

## Deployment Details

**Date:** 2026-06-12
**Service:** party-app (Railway, environment: production)
**Live target:** https://yait.social/home

## Commits Being Deployed

- perceptible-wave-roll plan
- perceptible-wave-roll implementation

## Changes Deployed

1. The SMIL roll on the shared `#yait-wave-clip` clipPath was sped up from one
   wavelength per 4s to one per 1s (`WAVE_ROLL_PERIOD_MS = 1000`), raising crest
   travel from ~13 px/s to ~52 px/s so the wave is perceptibly rolling down the
   45-degree reveal slants instead of reading as a static curve. The roll vector
   (0.02891 0.2 box units, one wavelength) is unchanged; only the period changed.
2. The roll now stops at rest once the reveal completes. `repeatCount` is derived
   from the reveal span (`ceil((REVEAL_DURATION_MS + REVEAL_TOP_DELAY_MS) / period)
   = 7`) and the animation carries `fill="freeze"`. Because one wavelength of
   translation is visually identical to the rest shape (the path keeps one-
   wavelength zero-phase margins on each end), freezing after a whole number of
   wavelengths lands exactly on rest. This also ends the prior perpetual repaint of
   the two clipped line layers, which the indefinite loop incurred off-text forever.
3. CSS untouched. No new mechanism: same SMIL-on-clipPath, same jitter-free
   guarantee (text elements are never transformed). Amplitude stays at 12.5px. The
   reduced-motion inline script still removes the animation node entirely.

## Cutover Sentinel

GET https://yait.social/home contains `fill="freeze"`.

Verified ABSENT in the BEFORE check: prod currently serves `dur="4s"` and
`repeatCount="indefinite"` with no `fill="freeze"`. A secondary marker, `dur="1s"`,
must also appear and `repeatCount="indefinite"` must disappear.

## Pre-Deploy Validation

- 82 in-scope yait unit/canary/integration tests green (WAVE_ROLL period and the
  whole-wavelength freeze-seam invariant; HTML contract for `dur="1s"`,
  `repeatCount="7"`, `fill="freeze"`, and the derived vector).
- 15 e2e green, including the strengthened live-pixel roll test: CSS animations
  pinned at 3.0s with SMIL running free, the edge region must change by more than
  800 px across 500ms (measured 987-1176 px at the new speed versus ~596 px for the
  old 4s roll, so the floor genuinely separates fast from slow) while a fully-
  revealed word region stays byte-identical (no jitter); a new test asserts the edge
  is byte-identical 1s apart after the reveal completes (the freeze reaches rest);
  reduced-motion run asserts the animation node is removed.
- Local rebuild + redeploy on a fresh server: CURL confirmed the served HTML carries
  `dur="1s"`, `repeatCount="7"`, `fill="freeze"`, the derived vector, the reduced-
  motion guard, and that `dur="4s"`/`repeatCount="indefinite"` are absent; bogus
  route 404; `/api/health` 200.
- Magnified cut-edge frames at 250ms steps reviewed: crest contours on the glyph
  edges visibly reshape across one wavelength.

## Earlier deployments today

- yait SMIL Rolling Waves: cutover 41s on the /home `animateTransform` sentinel,
  fully validated; introduced the roll this deploy retunes. Superseded here.
- yait Home Landing: cutover 42s on the /home 404-to-200 sentinel; includes
  db-pool-resilience.
- yait S-Curve Sail-In: cutover 43s; fixed an inert entrance. Superseded by
  three-beat-sail.
- yait Three-Beat Sail: cutover 42s; split travel from weave for three felt beats.
- yait Wake Reveal: cutover 32s; boat-synced wipe replaced word timers.
- yait Hull-Locked Reveal (2026-06-11): cutover 53s; bow-locked edge.
- yait Stern-Locked Reveal: cutover 42s; reveal edge moved to the stern.
- yait Staggered Headline: cutover 53s; left-aligned lockup, prod indent 100px.
- yait Slanted Reveal Edge: cutover 42s; prod measured 45 degrees exactly.
- yait Wave Reveal Edge (+ 2/4/8-period and 12.5px amplitude retunes): all prod-
  verified; established the wavy edge geometry this roll runs along.
- yait Bezier Wave Edge: cutover 41s; 64 cubics, zero kinks prod-verified.
- yait Symmetric Wave Crests: cutover 71s; worst apex offset 0.0px prod-verified.
- yait Independent Line Reveals: cutover 32s; prod gaps 202/271/0, no convergence.
- yait Open Envelope / Open Front V / Taller Tucked Fries: envelope staging, all
  prod-verified.
- yait Rolling Waves (carrier approach): REGRESSED prod (straight edge, text jitter)
  and was ROLLED BACK in 42s; root causes recorded; replaced by the SMIL approach.

## Production Validation

- PENDING (pre-deploy). To be filled after `railway up` completes and the sentinel
  is checked on prod.

## Final Status Assessment

**Deployment Status:** PENDING (pre-deploy entry recorded)
**Service Availability:** to be confirmed during cutover
