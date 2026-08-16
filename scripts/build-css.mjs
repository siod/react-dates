import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { bundleAsync } from 'lightningcss';

const source = resolve(import.meta.dirname, '../src/styles/index.css');
const destination = resolve(import.meta.dirname, '../lib/css/_datepicker.css');
const { code } = await bundleAsync({
  filename: source,
  minify: process.argv.includes('--minify'),
  targets: {
    chrome: 111 << 16,
    firefox: 113 << 16,
    safari: 16 << 16 | 4 << 8,
  },
});

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, code);
