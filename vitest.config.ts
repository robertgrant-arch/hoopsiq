import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the HoopsIQ client.
 *
 * Root is set to client/ to match the Vite build root.
 * Path aliases mirror vite.config.ts so imports like @/lib/... resolve correctly.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: [
      // Client-side tests
      "client/src/**/__tests__/**/*.test.ts",
      "client/src/**/*.test.ts",
      // Server-side pure-function tests (no DB / network deps allowed)
      "server/**/__tests__/**/*.test.ts",
      "server/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
