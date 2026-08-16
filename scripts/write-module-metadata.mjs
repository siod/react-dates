import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('esm', { recursive: true });
await writeFile('esm/package.json', '{\n  "type": "module"\n}\n');
