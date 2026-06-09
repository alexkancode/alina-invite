# Deployment Forensics - Guest Status Inline and Play Icon Centering

## Deployment Details

**Date:** 2026-06-09
**Branch:** main (in sync with origin/main after push)
**Service:** party-app (Railway, environment: production)
**Domains:** https://yait.social, https://party-app-production-d100.up.railway.app

## Commits Being Deployed

- guest-play-icon-centering: font-independent css-drawn icons
- guest-play-icon-centering implementation
- guest-play-icon-centering plan
- guest-status-inline implementation
- guest-status-inline plan

## Changes Deployed

1. **Inline status marks** - the separate "Going / Not going" line is replaced by a check or
   x beside the guest name; entries are one line shorter
2. **CSS-drawn play/pause icons** - guest-list preview buttons no longer render font glyphs
   (which centered differently per device); triangle and pause bars are drawn in CSS,
   geometrically centered on every OS, switched by the new `data-preview-state` attribute
   that `AudioPreviewManager` maintains
3. **No database migrations** - code-only deploy

## Pre-Deployment Baseline

- Cutover marker (lesson from the previous deploy applied): the `/_astro/index.*.css` bundle
  referenced by the page; new version contains `guest-status-mark`, old version does not
- Production page healthy from the previous deployment

## Risk Assessment

**Low Risk:**
- CSS and client-rendered markup only; renderer covered by unit, canary, and e2e suites
- `data-preview-state` is additive; modal behavior unchanged (verified by e2e)

**High Risk:**
- None identified

## Rollback Plan

1. Code-only deploy: redeploy previous commit `9a68a10` via Railway if needed

## Success Criteria

- Page 200 throughout; CSS bundle contains `guest-status-mark` and the
  `data-preview-state` icon rules
- Guest entries show name + inline mark, no status line
- Play button triangle centered; pause bars centered while playing (CSS-drawn)
- Previews, RSVP submission, and modal unchanged

## Deployment Process Tracking

### Stage 1: Push and Local Build
**Status:** COMPLETED (pushed 9a68a10..dbbe507; build clean)

### Stage 2: Railway Upload and Build
**Status:** COMPLETED
**Build Logs:** https://railway.com/project/e036295e-4dd3-4b68-8f61-eefca2c61714/service/67696074-f389-4fcb-8581-8263f347e66d?id=d10f34cd-9836-432c-acbd-8d1be6aeada3&

### Stage 3: Service Health and Cutover
**Status:** COMPLETED
**Result:** New CSS bundle (`/_astro/index.DYT13ivE.css`) containing `guest-status-mark`
detected 55 seconds after upload; page 200 throughout; the asset-based marker fixed the
blind spot from the previous deploy

### Stage 4: UI Validation
**Status:** COMPLETED
**Results (play states via reversible write to the same-IP "test" entry, then reverted):**
- 4 guest entries, each showing the inline check beside the name; zero standalone status
  lines remain
- Idle play button: CSS-drawn triangle centered (6x zoom screenshot)
- Playing: CSS-drawn pause bars centered (6x zoom screenshot)
- Test entry's song fields reverted to null; guest count unchanged at 4
- Regression: `/api/preview` 200

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (no downtime observed)
**Functionality:** VERIFIED against all success criteria
