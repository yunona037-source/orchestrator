import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the orchestrator CLI.
 *
 * - ESM config (`export default`); Vitest transpiles via Vite, so this is
 *   independent of the CommonJS `module` setting used by `tsc` in tsconfig.json.
 * - Node environment: the project is a Node CLI (no DOM).
 * - Tests are co-located with sources as `*.test.ts` / `*.spec.ts` under `src/`.
 *   These files are excluded from the `tsc` production build (see tsconfig.json),
 *   keeping the build output (`dist/`) free of test code while Vitest runs them.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
