import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

/** E2E на dev-сервере Vite: GREEN-API подменяется стабом в самих тестах (`e2e/greenApiStub.ts`), креды и сеть не нужны. */
export default defineConfig({
  testDir: "e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
