// eslint.config.cjs

const { defineConfig } = require('eslint/config');
const globals = require('globals');
const prettier = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');

module.exports = defineConfig([
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        project: './tsconfig.json', // remove this if you're not using type-aware linting
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': 'off', // handled by TS
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'func-names': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
    },
  },
  // Prettier integration to avoid conflicts
  {
    files: ['**/*.{ts,mts,cts}'],
    ...prettier,
  },
  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', 'temp/', '*.log'],
  },
]);
