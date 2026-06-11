# Deployment Forensics - Counter Text Styling

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- dock-carousel: counters as plain text

## Changes Deployed

1. Going/Not Going counters lose all pill chrome (background, radius, padding) and render
   as plain colored text; the Not Going toggle keeps its click behavior with a color shift
   plus underline as the active cue and dimming when disabled; CSS only

## Validation

- 12 guest-list e2e green locally; screenshots reviewed
- Cutover 47 seconds after upload; prod computed styles confirm transparent backgrounds,
  zero radius, magenta Going / purple Not Going text; labels Going (5) / Not Going (0)
- Screenshot shows the dock with all five live guests including two art cards

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (page 200 throughout)
