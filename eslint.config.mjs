// ESLint 9 flat config. SPEC 01 pedia `.eslintrc.cjs`, mas o ESLint 9 usa flat
// config como padrão estável — divergência registrada em decisoes.md (D-003).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // `any` só com justificativa (CLAUDE.md §2) — avisamos, não bloqueamos o build.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier,
);
