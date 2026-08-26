import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  // Most of the entry chunk is static army-list data. Its current 795 kB
  // minified size compresses to about 167 kB over the network, so keep a
  // slightly higher warning budget while still flagging meaningful growth.
  build: {
    chunkSizeWarningLimit: 850,
  },
  // 5273 instead of Vite's default 5173, which collides with another local
  // app. Overridable via PORT or --port (Playwright's web server uses 5177).
  server: process.env.PORT
    ? { port: Number(process.env.PORT), strictPort: true }
    : { port: 5273 },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    css: true,
    // App tests plus the data-pipeline test in scripts/. The Playwright
    // layout tests live in tests/ and run separately via `npm run test:layout`.
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
});
