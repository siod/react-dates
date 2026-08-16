import { globSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

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

const sourceEntries = Object.fromEntries(
  globSync(['src/**/*.js', 'src/**/*.jsx']).map((file) => {
    const name = relative('src', file).slice(0, -extname(file).length);
    return [name, resolve(import.meta.dirname, file)];
  }),
);

export default defineConfig(({ mode }) => {
  const isCommonJS = mode === 'cjs';

  return {
    plugins: [react()],
    build: {
      emptyOutDir: true,
      lib: {
        entry: sourceEntries,
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
