import { defineConfig } from "vitest/config";

export default defineConfig({
  // Oxc needs these explicitly: the decorators in this package are the legacy
  // TypeScript ones, and Nest's DI relies on the emitted design:paramtypes.
  oxc: {
    decorator: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "tests/e2e/**/*.spec.ts"],
    testTimeout: 10_000,
    coverage: {
      reportsDirectory: "./test-results/coverage",
    },
  },
});
