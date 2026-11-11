import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/auth',
  use: {
    baseURL: 'http://localhost:5174',
    browserName: 'chromium',
    serviceWorkers: 'block',
  },
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js --host localhost --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    env: {
      VITE_API_BASE_URL: 'http://api.demo.test',
      VITE_SUPABASE_URL: 'https://auth.demo.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_demo_fixture_only',
    },
  },
});
