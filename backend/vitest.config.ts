import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Legacy *.spec.ts files at src/common and src/modules/catalog are
    // hand-run tsx scripts (no vitest suites) — only real suites here.
    include: ["src/modules/assistant/**/*.spec.ts", "src/common/redis-cache.memory.spec.ts", "test/**/*.spec.ts"],
    alias: { scripts: new URL("./scripts/", import.meta.url).pathname },
    environment: "node",
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
