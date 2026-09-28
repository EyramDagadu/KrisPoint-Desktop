import { defineConfig } from '@playwright/test';

const port = 4187;
const databasePath = `/tmp/krispoint-letterhead-${process.pid}.db`;
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests',
  testMatch: 'letterhead-pdf.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    serviceWorkers: 'block',
    headless: true,
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : undefined,
    acceptDownloads: true,
  },
  webServer: {
    command: `VITE_KRISPOINT_EDITION=solo DATABASE_URL=sqlite://${databasePath} KRISPOINT_SOLO_DB_PATH=${databasePath} SOLO_ENCRYPTION_KEY=letterhead-test-encryption-key-32-chars SOLO_AUDIT_KEY=letterhead-test-audit-key-32-characters PORT=${port} pnpm --filter @workspace/krispoint run dev`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});