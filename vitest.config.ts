import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the HoopsOS client.
 *
 * Root is set to client/ to match the Vite build root.
 * Path aliases mirror vite.config.ts so imports like @/lib/... resolve correctly.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["client/src/**/__tests__/**/*.test.ts", "client/src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
