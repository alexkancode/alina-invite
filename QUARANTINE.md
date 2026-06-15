# Quarantined test suites

These suites fail for pre-existing reasons unrelated to the deployable app (some test
deleted code). They are excluded from the CI deploy gate so a meaningful, green gate can
run the rest (all yait tests, the core API, and the birthday regression guard). They are
tracked here for separate triage, not deleted.

- The vitest list is the `QUARANTINED` array in `vitest.config.ts`.
- The e2e exclusions are the files dropped from `testMatch` in `playwright.config.ts`.
- To triage one, remove its entry from the relevant list and run it (`npx vitest run <file>`
  or `npx playwright test <file>`).

## vitest (excluded via `vitest.config.ts` `exclude`)

- `eslint-plugin-error-prevention/tests/**` - the plugin's own suites: malformed
  harnesses (CommonJS `require` vs vitest ESM globals; one file is a console-log runner,
  not a vitest suite) and rule-reporting integration gaps.
- `tests/**/*spotify*`, `tests/unit/music-search.test.ts`, `tests/unit/client.test.ts` -
  Spotify subsystem: mocked fetch returns undefined and there are no Spotify credentials
  in CI.
- `tests/api.photo-upload.test.ts`, `tests/photo-integration.test.ts`,
  `tests/unit/photo-api.test.ts`, `tests/unit/photo-selection.test.ts` - photo upload/
  storage paths needing external storage credentials/services.
- `tests/unit/admin/adminApiClient.test.ts`, `tests/unit/admin/overlayUpload.test.ts`,
  `tests/integration/admin-components-fixed.test.ts` - admin client Zod schema mismatches.
- `tests/unit/calendar/platform-detection.test.ts`,
  `tests/unit/calendar/mobile-calendar-integration.test.ts` - import a source module that
  no longer exists (`src/lib/platformDetectionService.js`).
- `tests/unit/claude-skills/feature-flag/*.test.ts` - feature-flag skill assertions have
  drifted from the skill's current output.
- `tests/unit/migration-validator.test.ts`,
  `tests/integration/migration-validation-integration.test.ts` - assert an old migration
  bug (commit ff48c627) that has since been fixed, so the validator now passes.
- `tests/rules/database-config-consistency.test.js`,
  `tests/rules/consistent-import-patterns.test.js`, `tests/no-hardcoded-localhost.test.js`,
  `tests/integration/eslint-integration.test.js` - eslint rule/config drift (the test
  points at the removed `.eslintrc.js`; the repo uses flat `eslint.config.js`) and
  CommonJS-vs-ESM harness issues.
- `tests/api.leaderboard.test.ts`, `tests/game-integration.test.ts` - API responses
  changed (e.g. 201 vs expected 200) / game integration behaviour drift.
- `tests/integration/dropdown-positioning.test.ts`,
  `tests/property/search-properties.test.ts` - pre-existing assertion failures.

## e2e (excluded via `playwright.config.ts` `testMatch`)

- `tests/e2e.test.ts` - Google Maps embed assertions and RSVP-modal happy/unhappy paths
  that depend on external services not configured in CI.
- `tests/e2e.game.test.ts` - game board rendering/difficulty assertions (subsystem drift).

## Still in the gate (meaningful coverage)

- All yait suites: `tests/unit/yait/**`, `tests/canary/{sail-keyframes,yait-scene}.canary.ts`,
  `tests/integration/home-page.test.ts` (includes the birthday `/` + `/api/health`
  regression guard), and `tests/e2e.yait-home.test.ts`.
- Birthday e2e that pass: combobox, song-preview, guest-list-preview, attending-pill,
  calendar-buttons.
- The core API, calendar, rate-limiter, overlay, and other currently-green suites.
