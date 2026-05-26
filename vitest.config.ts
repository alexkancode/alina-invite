import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/api.test.ts', 'tests/api.leaderboard.test.ts'],
  },
});
