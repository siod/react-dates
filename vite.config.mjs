import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(readFileSync(
  new URL('./package.json', import.meta.url),
  'utf8',
));
const external = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
];

export default defineConfig(({ mode }) => {
  const isCommonJS = mode === 'cjs';

  return {
    plugins: [react()],
    build: {
      emptyOutDir: true,
      lib: {
        entry: {
          index: resolve(import.meta.dirname, 'src/index.js'),
          constants: resolve(import.meta.dirname, 'src/constants.js'),
          initialize: resolve(import.meta.dirname, 'src/initialize.js'),
        },
        formats: [isCommonJS ? 'cjs' : 'es'],
      },
      outDir: isCommonJS ? 'lib' : 'esm',
      rollupOptions: {
        external: (id) => external.some((dependency) => (
          id === dependency || id.startsWith(`${dependency}/`)
        )),
        output: {
          entryFileNames: '[name].js',
          exports: 'named',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
      sourcemap: true,
    },
  };
});
