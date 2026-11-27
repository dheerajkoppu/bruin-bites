import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "4100";

export default defineConfig({
  testDir: "tests",
  // Tests share one database, so running them one at a time keeps their data from colliding
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build --prefix ../client && node start-server.js",
    url: `http://localhost:${port}/api/health`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
