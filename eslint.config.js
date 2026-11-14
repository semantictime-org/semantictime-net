import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      '.tmp/',
      'reports/',
      'research_notes/',
      'coverage/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // プロジェクトの方針: any / unknown を使わない
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'TSUnknownKeyword', message: 'unknown 型は使わない（プロジェクトの方針）' },
        {
          selector: 'ClassDeclaration',
          message: 'class は使わない（プロジェクトの方針。Error の継承が必要な場合だけ例外）',
        },
      ],
    },
  },
);
