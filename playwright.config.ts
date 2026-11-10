import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pwa',
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    serviceWorkers: 'allow',
  },
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js preview --host localhost --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
});
