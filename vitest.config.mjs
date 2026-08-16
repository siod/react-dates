import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['test-modern/**/*.test.{js,jsx}'],
    restoreMocks: true,
    setupFiles: ['./test-modern/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/index.{js,jsx}'],
      // Prevent the modern suite from losing ground while component coverage
      // is expanded toward the v22 release target (90/90/90/85).
      thresholds: {
        statements: 55,
        lines: 58,
        functions: 46,
        branches: 42,
      },
    },
  },
});
