# Full Width Guest List — Implementation Plan

Feature alias: `full-width-guest-list`

## Step 1 — Test first

- Extend `tests/e2e.guest-list-preview.test.ts`: at the default 1280px viewport the
  `#rsvp-guest-list` bounding width exceeds 900px (old cap was 791px).

## Step 2 — Markup and styles

- `index.astro`: move the `#rsvp-guest-list` block from inside `main` to a sibling
  immediately after `</main>`, as a `section` carrying `relative z-10` (matching main's
  stacking above the sparkle layers) and the existing fade-in class.
- Replace the `mt-phi-2xl` column-spacing utility with a `#rsvp-guest-list` rule providing
  top spacing and horizontal/bottom padding for the full-width context.

## Step 3 — Verify, deploy

- Guest-list e2e; rebuild/redeploy locally; screenshots at 1280px and 390px confirming
  edge-to-edge flow, centered Play all, intact art cards; standard prod deploy with
  forensics (asset cutover, computed-width validation, no data writes).

## PR-Readiness Review

- Markup relocation plus one spacing rule; no inline styles, utilities duplicated, or
  comments; behavior locked by the existing suite plus the new width assertion.
