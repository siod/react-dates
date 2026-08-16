import { rm } from 'node:fs/promises';

await Promise.all([
  rm(new URL('../lib', import.meta.url), { force: true, recursive: true }),
  rm(new URL('../esm', import.meta.url), { force: true, recursive: true }),
  rm(new URL('../coverage', import.meta.url), { force: true, recursive: true }),
]);

