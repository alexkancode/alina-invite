import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e.test.ts', 'e2e.game.test.ts', 'e2e.combobox-selected-state.test.ts', 'e2e.song-preview.test.ts'],
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:4321',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      }
    },
  ],
});
