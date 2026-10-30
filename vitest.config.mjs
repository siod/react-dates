import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import resolveSourceJs from './scripts/resolve-source-js.mjs';

export default defineConfig({
  plugins: [resolveSourceJs(), react()],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{js,jsx,ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/**/index.{js,jsx,ts,tsx}'],
      // Ratchet coverage after each migration wave while the suite expands
      // toward the v22 release target (90/85/90/90).
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
});
