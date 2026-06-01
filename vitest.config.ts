import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
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
      'eslint-plugin-error-prevention/tests/**/*.test.js'
    ],
    // Set timeout for image processing tests
    testTimeout: 10000,
  },
});
