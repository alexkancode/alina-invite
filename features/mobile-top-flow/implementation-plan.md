# Mobile Top Flow — Implementation Plan

Feature alias: `mobile-top-flow`

## Step 1 — Test first

- Extend the mobile e2e: at 390px the first visible main child's top sits within 10px of
  the viewport top, and main's computed bottom padding is at least 180px (dock clearance).

## Step 2 — Styles (mobile media block only)

- `main` mobile override: `padding-top: 0`, `padding-bottom: 200px` (covers the dock's
  140px card cap plus its padding, with margin).
- `.stripe-panel` mobile `margin-top: 0`.

## Step 3 — Verify, deploy

- e2e; rebuild/redeploy; measure top offset and map-vs-dock gap at 390px; full-page mobile
  screenshot; prod deploy (asset cutover via served CSS content) and the same measurements
  live.

## PR-Readiness Review

- Three values in existing mobile rules; desktop untouched; no new rules or comments; the
  layout property is locked by an e2e measurement.
