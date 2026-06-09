# Deployment Forensics - Any Song Search

## Deployment Details

**Date:** 2026-06-09
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- any-song-search implementation
- any-song-search plan

## Changes Deployed

1. **Unscoped music search** - the `year:1970-1979` Spotify query suffix and the 70s-only
   result filter are removed; guests can pick any song
2. **New field label** - "Disco song for the party playlist (optional)" in both widget
   branches
3. **No database migrations** - code-only deploy

## Pre-Deployment Baseline

- Cutover marker: the page HTML server-renders the field label, so the new label text
  appearing at `/` marks the new version (verified locally: 1 occurrence)
- Production search currently returns only 70s results

## Risk Assessment

**Low Risk:** a deletion in the service plus label text; behavior locked by updated suites
(108 unit/canary/integration + 13 e2e green locally). Search cache is in-memory, so stale
70s-scoped cache entries vanish with the container swap.

**High Risk:** none identified

## Rollback Plan

- Code-only: redeploy previous commit `f6dc8af` via Railway if needed

## Success Criteria

- Page HTML contains the new label (cutover marker)
- Prod search for a modern song returns post-2020 results
- Prod search for a 70s song still returns results; missing query still 400
- RSVP, preview, and guest list endpoints unchanged

## Deployment Process Tracking

### Stage 1: Push and Build
**Status:** COMPLETED (pushed f6dc8af..3e35f03; build clean)

### Stage 2: Railway Upload and Cutover
**Status:** COMPLETED
**Result:** New label detected in served HTML 85 seconds after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=5eb609cc-3c5f-4cc3-acb6-792466953a8a&

### Stage 3: API and UI Validation
**Status:** COMPLETED
**Results:**
- Modern search: "espresso sabrina carpenter" returns Espresso (2024) - decade scope gone
- 70s search: "dancing queen" still returns Dancing Queen (1976)
- Missing query: 400 unchanged
- RSVP and preview endpoints: 200

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
