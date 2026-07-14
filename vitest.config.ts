import { defineConfig } from 'vitest/config';

// Config única com fileParallelism desativado: integração/E2E compartilham o
// mesmo banco e usam truncate no beforeEach — rodar arquivos em paralelo causa
// corrida entre eles. A separação da pirâmide (unitário/integração/E2E/carga)
// é feita por diretório + jobs de CI (path-filtered) e `test:carga` (bench).
// Nota (D-008): `projects` foi tentado, mas o fileParallelism por projeto não é
// honrado sob filtro de path, reintroduzindo flakiness — revertido.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['testes/**/*.spec.ts'],
    globals: false,
    fileParallelism: false,
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
