import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

if (!process.env.CI && !process.env.PLAYWRIGHT_BASE_URL) {
  loadEnv({ path: ".env.local" });
}

// Si PLAYWRIGHT_BASE_URL apunta a un host remoto (preview/produccion), no se
// levanta el dev server local: se testea contra ese deploy directamente.
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remoteBaseURL ?? "http://localhost:3000";
const isRemote = Boolean(remoteBaseURL);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: isRemote
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
