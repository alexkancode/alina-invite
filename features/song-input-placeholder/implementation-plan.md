# Song Input Placeholder — Implementation Plan

Feature alias: `song-input-placeholder`

## Step 1 — Tests first

- `tests/integration/spotify-accessibility.test.ts`: fixture drops the label and carries
  the new placeholder and `aria-label`; the "associate label with input" test becomes
  "input carries an aria-label accessible name".

## Step 2 — Widget markup and style

- `MusicSearchWidgetDynamic.astro` (enabled branch):
  - delete the `<label for="spotify-search">` block
  - placeholder text replaced; `aria-label="Disco song for the party playlist (optional)"`
    added to the input
  - remove the `placeholder-metallic-silver/50` utility; add a
    `.spotify-search-input::placeholder` rule (warm cream at readable opacity) to the
    existing global style block
- Flag-disabled branch unchanged (select keeps its label).

## Step 3 — Verify, rebuild, redeploy, deploy to prod

- Accessibility plus combobox suites and modal e2e; rebuild/redeploy locally; screenshot
  the modal and inspect placeholder legibility against the input background; standard prod
  deploy with forensics (asset-hash cutover, client-side modal validation, no data writes).

## PR-Readiness Review

- No utilities; one new style rule replacing an inline utility class (net win per the
  no-inline-styles checklist); accessibility maintained; tests updated in the same commit.
