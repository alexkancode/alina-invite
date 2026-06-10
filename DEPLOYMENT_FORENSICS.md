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
**Status:** pending

### Stage 2: Migration and UI Validation
**Status:** pending
