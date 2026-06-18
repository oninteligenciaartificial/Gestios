import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

if (!process.env.CI && !process.env.PLAYWRIGHT_BASE_URL) {
  loadEnv({ path: ".env.local" });
}

// Si PLAYWRIGHT_BASE_URL apunta a un host remoto (preview/produccion), no se
// levanta el dev server local: se testea contra ese deploy directamente.
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const e2ePort = process.env.GESTIOS_E2E_PORT ?? "3107";
const baseURL = remoteBaseURL ?? `http://127.0.0.1:${e2ePort}`;
const isRemote = Boolean(remoteBaseURL);
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "1";

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
        command: `npm run dev -- --hostname 127.0.0.1 --port ${e2ePort}`,
        url: baseURL,
        reuseExistingServer,
        timeout: 120_000,
      },
});
