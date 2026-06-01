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
      'tests/unit/admin/**/*.test.ts'
    ],
    // Set timeout for image processing tests
    testTimeout: 10000,
  },
});
