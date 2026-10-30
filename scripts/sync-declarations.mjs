import { existsSync } from 'node:fs';
import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';

async function declarationFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return declarationFiles(path);
    return path.endsWith('.d.ts') ? [path] : [];
  }));
  return files.flat();
}

function withRuntimeExtension(path, specifier) {
  if (!specifier.startsWith('.') || extname(specifier)) return specifier;
  const declarationTarget = resolve(dirname(path), specifier);
  if (existsSync(join(declarationTarget, 'index.d.ts'))) return `${specifier}/index.js`;
  return `${specifier}.js`;
}

for (const path of await declarationFiles('lib')) {
  const source = await readFile(path, 'utf8');
  const rewritten = source.replace(
    /((?:from\s+|import\s*\()(['"]))(\.{1,2}\/[^'"]+)(\2)/g,
    (match, prefix, quote, specifier, suffix) => (
      `${prefix}${withRuntimeExtension(path, specifier)}${suffix}`
    ),
  );
  if (rewritten !== source) await writeFile(path, rewritten);
}

await cp('lib', 'esm', {
  recursive: true,
  filter: (source) => {
    const path = relative('lib', source);
    return !path || !extname(path) || path.endsWith('.d.ts') || path.endsWith('.d.ts.map');
  },
});
