import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/live/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      // Coverage applies to ALL source code except composition root, types,
      // and interfaces. Everything else must have unit tests with mocks.
      include: ['src/**/*.ts'],
      exclude: [
        // Composition root — no meaningful behavior to test
        'src/bootstrap.ts',
        'src/main.ts',
        'src/modules/hello/di/hello.container.ts',
        // Type-only declarations — interfaces and types erased at runtime
        'src/modules/**/application/ports/*.port.ts',
        'src/modules/**/domain/entities/*.ts',
        'src/modules/**/application/models/*.ts',
        'src/modules/**/domain/filters/filter-type.ts',
        'src/modules/**/domain/infrastructure/hacker-news/parse-result.ts',
        'src/modules/hello/application/ports/get-hello.port.ts',
        'src/modules/hello/presentation/http/hello-response.dto.ts',
        'src/shared/application/ports/clock.port.ts',
        'src/shared/application/ports/logger.port.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
