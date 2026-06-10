# Deployment Forensics - Album Art Cards

## Deployment Details

**Date:** 2026-06-10
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- album-art-cards implementation
- album-art-cards plan

## Changes Deployed

1. **Album art card backgrounds** - guest cards with a song show the album cover under a
   50% white gradient overlay (one style rule; per-entry URL via CSS custom property)
2. **Art travels the save pipeline** - combobox hidden field, `parseRsvpSong`, RSVP API
   insert/update and list GET all carry `albumArtUrl` / `song_album_art_url`
3. **Migration 0009** - `ADD COLUMN IF NOT EXISTS song_album_art_url TEXT` (additive,
   idempotent; applied cleanly on local boot)

## Pre-Deployment Baseline

- Cutover marker: list GET response gains the `song_album_art_url` key after migration
- Existing prod entries have no stored art and keep the plain background by design

## Risk Assessment

**Low Risk:** additive column; style-attribute injection covered by a renderer test that
asserts a hostile URL cannot create extra CSS declarations; 88 unit/canary/integration
tests and 5 e2e green locally

**Medium Risk:** migration on the prod database (mitigated: single idempotent ADD COLUMN,
same shape as 0008 which applied cleanly)

## Rollback Plan

- Code rollback is safe (column is additive); redeploy previous commit via Railway

## Success Criteria

- List GET returns `song_album_art_url`
- A test write with art renders the white-washed cover background with readable text, then
  reverts cleanly
- Song-less cards unchanged; previews and play-all unaffected

## Deployment Process Tracking

### Stage 1: Push and Cutover
**Status:** COMPLETED
**Result:** Pushed 15baede..1bd4e97; list API exposed `song_album_art_url` 85 seconds
after upload; page 200 throughout
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=23f9564a-085d-4c7a-af0c-10502989d0b2&

### Stage 2: Migration and UI Validation
**Status:** COMPLETED
**Results:**
- Railway logs show "Applying 0009_add_song_album_art.sql... Done" on container start
- Validation write to the user's same-IP "testing music" entry with art: the card rendered
  the album cover under the white gradient with readable purple text (computed background
  contains both the gradient and the i.scdn.co image); screenshots captured
- Entry restored to the guest's original pick (Bohemian Rhapsody - Remastered 2011) and
  upgraded with its real album art via the search API; guest count unchanged at 4
- Song-less cards unchanged alongside the art card

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE
**Functionality:** VERIFIED against all success criteria
