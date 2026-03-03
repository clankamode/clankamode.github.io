import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'vite --host 127.0.0.1 --port 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
