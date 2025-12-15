/**
 * @file eslint.config.js
 * @description ESLint Configuration.
 * Enforces code quality standards, React best practices, and error checking.
 * Uses the modern "Flat Config" format.
 * @author Group 1
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // Ignore build artifacts
  globalIgnores(['dist']),

  {
    files: ['**/*.{js,jsx}'],

    // Base configurations
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],

    // Browser environment globals
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },

    // Custom Rules
    rules: {
      // Allow unused vars if they start with Uppercase (often imports) or Underscore
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]);