# Deployment Forensics - Attending Pill Toggle

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- attending-pill-toggle implementation
- attending-pill-toggle plan

## Changes Deployed

1. **Two-sided pill toggle** for going/not-going: one rounded control, halves fill pink
   (#FFB6D9, dark text) and magenta (#FF007F, white text) when selected via
   `label:has(input:checked)`; real radio inputs remain underneath (visually hidden,
   focusable) so required-validation, change events, and the submit payload are unchanged
2. **No API or database changes** - markup and CSS in the modal only

## Pre-Deployment Baseline

- Cutover marker (content-based): `attending-toggle` appears in the served CSS

## Risk Assessment

**Low Risk:** radio semantics preserved (locked by an e2e asserting exclusivity at the
input level plus submit enablement); 4-test pill suite green locally with state
screenshots at all three states

**Known environmental blocker, not a regression:** the ongoing Spotify search outage
(503s/timeouts upstream) keeps 4 search-dependent combobox e2e red in both environments;
those paths are untouched by this change and were green earlier today whenever upstream
was healthy

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod modal renders the pill; clicking halves checks the underlying radios exclusively;
  selected fills match the palette; submit enables with name plus a side

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** pending

### Stage 2: UI Validation
**Status:** pending
