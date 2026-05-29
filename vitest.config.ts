import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Test-only config. Intentionally NOT referenced by any tsconfig so the build
// type-check skips it (vitest bundles its own vite, whose Plugin types differ
// from the project's vite 6 — irrelevant at test runtime via esbuild).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
