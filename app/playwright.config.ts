import { defineConfig } from '@playwright/test';

// A unique test-only namespace; never publish the production active selection.
process.env.MOVIED8_TEST_ROOT ??= `/codex-sync-tests/run-${Date.now()}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/playback.spec.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required'],
    } } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: { VITE_DATABASE_ROOT: process.env.MOVIED8_TEST_ROOT },
  },
});
