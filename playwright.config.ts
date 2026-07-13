import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:5177",
    viewport: { width: 900, height: 1200 },
    deviceScaleFactor: 2,
  },
  webServer: {
    command: "npm run dev -- --port 5177 --strictPort",
    url: "http://localhost:5177",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
