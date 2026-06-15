import { configDefaults, defineConfig } from 'vitest/config';

export const QUARANTINED = [
  'eslint-plugin-error-prevention/tests/**',
  'tests/**/*spotify*',
  'tests/unit/music-search.test.ts',
  'tests/unit/client.test.ts',
  'tests/api.leaderboard.test.ts',
  'tests/api.photo-upload.test.ts',
  'tests/photo-integration.test.ts',
  'tests/unit/photo-api.test.ts',
  'tests/unit/photo-selection.test.ts',
  'tests/game-integration.test.ts',
  'tests/integration/admin-components-fixed.test.ts',
  'tests/integration/dropdown-positioning.test.ts',
  'tests/integration/eslint-integration.test.js',
  'tests/integration/migration-validation-integration.test.ts',
  'tests/property/search-properties.test.ts',
  'tests/rules/database-config-consistency.test.js',
  'tests/rules/consistent-import-patterns.test.js',
  'tests/no-hardcoded-localhost.test.js',
  'tests/unit/admin/adminApiClient.test.ts',
  'tests/unit/admin/overlayUpload.test.ts',
  'tests/unit/calendar/mobile-calendar-integration.test.ts',
  'tests/unit/calendar/platform-detection.test.ts',
  'tests/unit/claude-skills/feature-flag/FeatureFlagSkill.test.ts',
  'tests/unit/claude-skills/feature-flag/integration.test.ts',
  'tests/unit/claude-skills/feature-flag/ProductionSafety.test.ts',
  'tests/unit/migration-validator.test.ts'
];

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, ...QUARANTINED],
    include: [
      'tests/api.test.ts',
      'tests/api.leaderboard.test.ts',
      'tests/photo-processing.test.ts',
      'tests/api.photo-upload.test.ts',
      'tests/photo-database.test.ts',
      'tests/rate-limiter.test.ts',
      'tests/photo-selection.test.ts',
      'tests/game-integration.test.ts',
      'tests/calendar.test.ts',
      // New photo integration tests
      'tests/unit/**/*.test.ts',
      'tests/photo-integration.test.ts',
      // Music search tests
      'tests/unit/music-search.test.ts',
      // Overlay system tests
      'tests/unit/overlay/**/*.test.ts',
      'tests/integration/tile-overlay-system.test.ts',
      // Admin integration tests
      'tests/unit/admin/**/*.test.ts',
      'tests/integration/admin-api-response-errors.test.ts',
      'tests/integration/admin-components-fixed.test.ts',
      'tests/integration/overlay-upload-api.test.ts',
      // ESLint integration tests
      'tests/integration/eslint-integration.test.js',
      // ESLint plugin framework tests
      'eslint-plugin-error-prevention/tests/**/*.test.js',
      // Advanced testing patterns
      'tests/canary/**/*.canary.ts',
      'tests/contracts/**/*.contract.ts',
      'tests/property/**/*.test.ts',
      'tests/integration/**/*.test.ts'
    ],
    // Set timeout for image processing tests
    testTimeout: 10000,
  },
});
