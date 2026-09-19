import { defineConfig } from '@playwright/test';

const port = 4177;
const databasePath = `/tmp/krispoint-theme-${process.pid}.db`;
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests',
  testMatch: 'theme-regression.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: 'list',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : undefined,
  },
  webServer: {
    command: `VITE_KRISPOINT_EDITION=solo DATABASE_URL=sqlite://${databasePath} KRISPOINT_SOLO_DB_PATH=${databasePath} SOLO_ENCRYPTION_KEY=theme-test-encryption-key-32-chars SOLO_AUDIT_KEY=theme-test-audit-key-32-characters PORT=${port} pnpm --filter @workspace/krispoint run dev`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});