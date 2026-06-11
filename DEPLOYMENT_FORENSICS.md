# Deployment Forensics - Calendar Button Label Trim

## Deployment Details

**Date:** 2026-06-11
**Service:** party-app (Railway, environment: production)

## Commits Being Deployed

- calendar-button-labels: trim desktop labels

## Changes Deployed

1. Desktop labels trimmed to "Apple Calendar" / "Google Calendar"; mobile "Apple Cal" /
   "Google Cal" unchanged; text only

## Validation

- 8 calendar e2e green locally; desktop screenshot single-line labels
- Cutover detected 47 seconds after upload (old "Add to" text gone from served HTML)
- Prod HTML serves exactly the four expected label spans; hrefs and behavior untouched

## Final Status Assessment

**Deployment Status:** SUCCESSFUL
**Service Availability:** STABLE (page 200 throughout)
