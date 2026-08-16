import importX, { createNodeResolver } from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Generated outputs are checked by their build jobs rather than linted.
export default [
  {
    ignores: [
      '**/node_modules/**',
      'lib/**',
      'esm/**',
      'coverage/**',
      'dist/**',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
      'fixtures/*/node_modules/**',
      '.storybook-css/**',
      'index.js',
      'constants.js',
      'initialize.js',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      // Explicitly pin the peer baseline: react-plugin 7's automatic detector
      // still calls the pre-ESLint-10 context API when set to "detect".
      react: { version: '19.0' },
      'import-x/resolver-next': [createNodeResolver({
        extensions: ['.js', '.jsx', '.mjs', '.cjs', '.json'],
      })],
    },
  },
  importX.flatConfigs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      // React 18's automatic JSX transform makes this rule obsolete.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Components retain runtime PropTypes, but the plugin cannot follow the
      // local forbidExtraProps/HOC composition used throughout this library.
      'react/prop-types': 'off',
      // These helpers intentionally keep the latest callback in a ref and
      // lazily create DOM resources in an effect for SSR safety.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['test-modern/**/*.test.{js,jsx}', 'test-modern/helpers/**/*.{js,jsx}'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['fixtures/**/*.{js,jsx,mjs,cjs}'],
    rules: {
      // Fixture dependencies are installed only after npm pack in CI.
      'import-x/no-unresolved': 'off',
    },
  },
  {
    files: ['eslint.config.mjs'],
    rules: {
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },
];
