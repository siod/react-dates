import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];

export default function resolveSourceJs() {
  return {
    name: 'resolve-source-js',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) return null;
      const basePath = resolve(dirname(importer), source.slice(0, -3));
      const sourcePath = sourceExtensions
        .map((extension) => `${basePath}${extension}`)
        .find((candidate) => existsSync(candidate));
      return sourcePath || null;
    },
  };
}
