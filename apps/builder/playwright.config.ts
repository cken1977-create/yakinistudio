import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 3100)
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.E2E_BASE_URL || `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'phone-390', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, browserName: 'chromium' } },
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    // Test mode: stand-in model and mock websites, in-memory store. Refused on Vercel (runtime.ts).
    env: { ...(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined)) as Record<string, string>), BUILDER_TEST_MODE: '1' },
    timeout: 60_000,
  },
})
