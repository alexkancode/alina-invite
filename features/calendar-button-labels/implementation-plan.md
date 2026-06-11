# Calendar Button Labels — Implementation Plan

Feature alias: `calendar-button-labels`

## Step 1 — Tests first

- Extend `tests/e2e.calendar-buttons.test.ts`: desktop viewport shows "Add to Apple
  Calendar" / "Add to Google Calendar" each on one line (element height consistent with a
  single text line); a 390px-viewport test shows "Apple Cal" / "Google Cal" with the two
  buttons sharing the same vertical position (side by side).

## Step 2 — Markup and styles

- `index.astro`: button row becomes `flex-row` at all widths; each button carries two
  label spans (`hidden sm:inline` full, `sm:hidden` short, both nowrap); the
  `text-phi-base` utility is replaced by a `.cal-link` font-size rule sized for
  single-line fit, tuned against screenshots.

## Step 3 — Verify, deploy

- Calendar e2e; rebuild/redeploy; screenshots at 1280px and 390px; prod deploy (marker:
  the new label text server-rendered in HTML); prod DOM check.

## PR-Readiness Review

- One style rule replacing a utility; responsive labels via existing utility classes; no
  behavior changes (hrefs and navigation semantics untouched, still covered by the
  existing e2e); no comments.
