# Deployment Forensics - Private RSVP Message

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- private-rsvp-message implementation
- private-rsvp-message plan

## Changes Deployed

1. **New message placeholder** - "Additional message (any food allergies or questions?)"
2. **Messages are private** - removed from the public list GET (SQL SELECT and both dev
   fallback shapes); still stored, still echoed in the submitter's own POST response
3. **No schema changes**

## Pre-Deployment Baseline

- Cutover marker: the new placeholder text is server-rendered in the page HTML
- Prod list currently exposes a `message` key on every row

## Risk Assessment

**Low Risk:** column removed from read paths only; nothing on the page consumed it; the
privacy property is locked by an integration test, the list-payload canary, and the
updated legacy api test (32 green locally)

## Rollback Plan

- Code-only: redeploy previous commit via Railway if needed

## Success Criteria

- Prod page serves the new placeholder; the list GET returns rows without a message key;
  a posted message is echoed only to the submitter

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 6f28a5b..1ab329b; new placeholder text detected in served HTML 139
seconds after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=b23e271d-80c6-411c-be9f-43b21fb3d0c4&

### Stage 2: Validation
**Status:** COMPLETED
**Results:**
- List GET keys contain no `message`; a probe message posted to the test row was echoed in
  the submitter's own response and never appeared in the list payload; probe cleared after
- Incidental re-proof: the probe POST carried no albumArtUrl and the row's art survived
  (preserve-album-art behaving in production)
- Final state: test row going with song and art, guest count 4

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
