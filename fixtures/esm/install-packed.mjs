import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const tarball = process.env.REACT_DATES_TARBALL;
if (!tarball) {
  throw new Error('Set REACT_DATES_TARBALL to an npm pack output before installing the fixture.');
}

const tarballPath = resolve(process.cwd(), tarball);
if (!existsSync(tarballPath)) throw new Error(`Tarball does not exist: ${tarballPath}`);

const result = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['install', '--no-save', '--ignore-scripts', '--package-lock=false', tarballPath],
  { stdio: 'inherit' },
);

if (result.status !== 0) process.exit(result.status || 1);
