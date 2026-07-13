import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['testes/**/*.spec.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/aplicacao/**', 'src/dominio/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
