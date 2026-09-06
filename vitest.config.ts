import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    // Unit/integration tests live in a top-level tests/ tree mirroring src/.
    // (E2E tests live in e2e/ and run under Playwright, not Vitest.)
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Node by default, because most tests are pure library code and a DOM per
    // file is slow. Component tests opt in with a `@vitest-environment jsdom`
    // docblock, so only the files that need a DOM pay for one.
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
