import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    reporters: 'default',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/plugins/**'],
      thresholds: {
        lines: 0.7,
        functions: 0.7,
        branches: 0.6,
        statements: 0.7,
      },
    },
  },
});
