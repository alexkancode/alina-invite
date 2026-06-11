# Deployment Forensics - yait Home Landing

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- yait-home-landing plan
- yait-home-landing implementation
- db-pool-resilience: survive idle connection loss without crashing

## Changes Deployed

1. New prerendered route /home: yait brand landing with the riviera bay hero —
   envelope sails in revealing "You Are Invited To" in Shrikhand, nine fry people
   bounce on docking, "join the yait club" tagline and CTA. Pure-CSS, transform and
   opacity only, prefers-reduced-motion fallback. No database dependency.
2. pg pool error listener in src/lib/db.ts: idle connection terminations no longer
   crash the Node process (previously an unhandled 'error' event was fatal —
   reproduced locally by stopping Postgres with a warm pool, fixed and re-proven).
3. No migrations. No changes to the live invite page or its APIs.

## Cutover Sentinel

GET https://yait.social/home transitions 404 (BEFORE, verified) to 200 containing
"join the yait club".

## Pre-Deploy Validation

- 29 unit/canary/integration tests green (yait scene, contract canary, /home
  integration with live-site regression guards, pool resilience)
- 4 e2e green including the compositor guard (transform/opacity-only animations)
- Full-suite pre-existing failures confirmed unrelated (identical at HEAD with
  changes stashed: 26 vitest sample failures, 26 e2e in disco/game suites)
- Curl suite locally: /home 200 with all content markers, 9 fries; route edges
  /homex /HOME /home/nope all 404; / 200 with RSVP form; health ok
- DB-stopped proof: /home 200 and process alive with Postgres stopped, health 503
  during outage, 200 after restart, pool error logged once

## Production Validation

- Cutover in 42 seconds (sentinel: /home 404 to 200 with "join the yait club")
- Prod curl suite: all headline words, tagline, CTA, Shrikhand present; 9 fries;
  /homex and /HOME 404; / 200 with the RSVP form intact; /api/health ok
- Railway logs: clean boot, server listening, all migrations skip (none new)
- Playwright against prod: headline "You Are Invited To" rendered, 9 fries, CTA
  visible; docked screenshot reviewed — envelope alongside the dock, fries up,
  coral CTA over the teal bay

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (live invite page 200 throughout)
