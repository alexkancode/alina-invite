# iOS Calendar Fix — Implementation Plan

Feature alias: `ios-calendar-fix`

## Step 1 — Generator validity (TDD)

- New `tests/unit/calendar-generator.test.ts`: starts with BEGIN:VCALENDAR as first bytes;
  CRLF-only line endings; no blank lines anywhere inside the calendar; no ACTION:EMAIL;
  two ACTION:DISPLAY alarms (-P1W and -P1D); TZNAME values CST/CDT; UID, DTSTAMP,
  METHOD:PUBLISH present; every line at most 75 octets.
- Update the legacy `tests/calendar.test.ts` expectation (`ACTION:EMAIL`) to the new
  contract.
- `calendarGenerator.ts`: drop the '' spacer entries, convert the EMAIL alarm to DISPLAY,
  fix TZNAME.

## Step 2 — Endpoint headers (TDD)

- Integration assertions: both calendar endpoints return `text/calendar; charset=utf-8`
  with `Content-Disposition: inline; filename=...`; personalized endpoint sends no-cache.
- Update both route files.

## Step 3 — Buttons

- `index.astro`: the calendar section renders two anchors sharing the existing button
  styling (flex row, stacking on small screens): Apple Calendar (href to the generic ics,
  same-tab, no target/download/JS) and Google Calendar (corrected
  `dates=20260711T200000Z/20260711T230000Z`, no ctz needed with absolute UTC,
  target=_blank).
- Remove the calendar transition click handler and its pageshow restore block (the
  animation is the root cause; reliability of the core action wins).

## Step 4 — E2E

- New `tests/e2e.calendar-buttons.test.ts`: both buttons visible; Apple anchor has no
  target attribute and its href fetches `text/calendar` with `inline` disposition (request
  fixture); Google anchor has target=_blank and the corrected dates parameter.

## Step 5 — Verify, deploy

- Suites; rebuild/redeploy; curl smoke of both endpoints (headers + body grep for the
  validity properties); screenshot the two-button section; prod deploy (marker: the
  corrected dates param server-rendered in HTML); prod curl of the live ics.
- On-device check is the user's final validation step on a real iPhone.

## PR-Readiness Review

- Generator stays the single ICS authority (no new utilities); header changes in the two
  routes that own them; button styling reuses the existing classes/inline-style block of
  the section (existing pattern; no new inline styles introduced beyond the duplicated
  card style of the sibling button); the removed animation handler deletes dead
  complexity rather than adding any; no comments; tests at unit, integration, e2e.
