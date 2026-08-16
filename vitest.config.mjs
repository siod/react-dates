import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['test-modern/**/*.test.{js,jsx}'],
    restoreMocks: true,
    setupFiles: ['./test-modern/setup.js'],
  },
});

