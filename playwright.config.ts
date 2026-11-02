import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // Use installed Chrome locally; CI installs Playwright Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    serviceWorkers: 'block',
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'small-phone', use: { viewport: { width: 320, height: 740 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'small-desktop', use: { viewport: { width: 1024, height: 768 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'landscape', use: { viewport: { width: 844, height: 390 } } },
  ],
  webServer: { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
