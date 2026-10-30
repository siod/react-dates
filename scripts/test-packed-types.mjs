import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const tarball = process.env.REACT_DATES_TARBALL;
if (!tarball) throw new Error('Set REACT_DATES_TARBALL to an npm pack output.');

const tarballPath = resolve(tarball);
const fixtureNames = ['react18', 'react19'];

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, { cwd, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

for (const fixtureName of fixtureNames) {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), `react-dates-${fixtureName}-`));
  try {
    await cp(resolve('fixtures/types', fixtureName), fixtureDirectory, { recursive: true });
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    run(npm, [
      'install',
      '--ignore-scripts',
      '--package-lock=false',
      '--no-save',
      tarballPath,
    ], fixtureDirectory);
    run(npm, ['run', 'test:types'], fixtureDirectory);
    console.log(`${basename(fixtureDirectory)} packed type fixture passed.`);
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
}
