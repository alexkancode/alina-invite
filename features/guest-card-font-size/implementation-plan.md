# Guest Card Font Size — Implementation Plan

Feature alias: `guest-card-font-size`

## Step 1 — Test first

- Extend `tests/e2e.guest-list-preview.test.ts`: the seeded entry's name computes to at
  least 18px and the song line to at least 16px.

## Step 2 — Styles

- `index.astro`: `font-size: 19px` on the `.guest-name` rule and `17px` on
  `.guest-song-line`; mobile media overrides go from 11px/10px to 13px/12px.

## Step 3 — Verify, deploy

- Rebuild/redeploy locally; screenshots at 1280px and 390px widths including an album-art
  card; guest-list e2e; standard prod deploy with forensics (asset-hash cutover, visual
  validation on the existing art card, no data writes).

## PR-Readiness Review

- CSS-only edits to existing rules; no inline styles, utilities, comments, or duplication;
  the e2e size floor is the regression lock.
