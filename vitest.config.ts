import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/api.test.ts',
      'tests/api.leaderboard.test.ts',
      'tests/photo-processing.test.ts',
      'tests/api.photo-upload.test.ts',
      'tests/photo-database.test.ts',
      'tests/rate-limiter.test.ts',
      'tests/photo-selection.test.ts',
      'tests/game-integration.test.ts'
    ],
    // Set timeout for image processing tests
    testTimeout: 10000,
  },
});
