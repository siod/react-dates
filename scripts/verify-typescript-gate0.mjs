import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const baseline = JSON.parse(await readFile('docs/typescript/gate-0-baseline.json', 'utf8'));
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const api = require('../lib/index.js');
const constants = require('../lib/constants.js');
const removedRootExports = new Set(['DateRangePickerShape', 'SingleDatePickerShape']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalize(value) {
  if (value instanceof Set) return [...value];
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

function runtimeTarget(entry, condition) {
  const target = condition ? entry[condition] : entry;
  return typeof target === 'string' ? target : target.default;
}

assert(
  JSON.stringify(Object.keys(api).sort())
    === JSON.stringify(baseline.rootExports.filter((name) => !removedRootExports.has(name))),
  'Runtime root exports changed beyond the planned TypeScript shape removals.',
);
assert(
  JSON.stringify(normalize(constants)) === JSON.stringify(baseline.constants),
  'Runtime constants changed from the Gate 0 baseline.',
);

const runtimeEntries = baseline.runtimeEntrypoints;
assert(runtimeTarget(packageJson.exports['.'], 'import') === runtimeEntries.root.import, 'Root ESM target changed.');
assert(runtimeTarget(packageJson.exports['.'], 'require') === runtimeEntries.root.require, 'Root CJS target changed.');
assert(runtimeTarget(packageJson.exports['./constants'], 'import') === runtimeEntries.constants.import, 'Constants ESM target changed.');
assert(runtimeTarget(packageJson.exports['./constants'], 'require') === runtimeEntries.constants.require, 'Constants CJS target changed.');
assert(runtimeTarget(packageJson.exports['./initialize'], 'import') === runtimeEntries.initialize.import, 'Initialize ESM target changed.');
assert(runtimeTarget(packageJson.exports['./initialize'], 'require') === runtimeEntries.initialize.require, 'Initialize CJS target changed.');
assert(runtimeTarget(packageJson.exports['./lib/*.js']) === runtimeEntries.libExtension, 'CJS extension target changed.');
assert(runtimeTarget(packageJson.exports['./lib/*']) === runtimeEntries.libExtensionless, 'CJS extensionless target changed.');
assert(runtimeTarget(packageJson.exports['./esm/*.js']) === runtimeEntries.esmExtension, 'ESM extension target changed.');
assert(runtimeTarget(packageJson.exports['./esm/*']) === runtimeEntries.esmExtensionless, 'ESM extensionless target changed.');

const css = await readFile(baseline.css.path);
const cssHash = createHash('sha256').update(css).digest('hex');
assert(cssHash === baseline.css.sha256, 'Compiled CSS changed from the Gate 0 baseline.');

const pack = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  env: {
    ...process.env,
    NPM_CONFIG_CACHE: join(tmpdir(), 'react-dates-npm-cache'),
  },
}))[0];
const packedFiles = new Set(pack.files.map(({ path }) => path));
const declarations = [
  'index.d.ts',
  'constants.d.ts',
  'initialize.d.ts',
  'components/CalendarWeek.d.ts',
  'internal/styles/withStyles.d.ts',
  'utils/isSameDay.d.ts',
];

for (const declaration of declarations) {
  assert(packedFiles.has(`lib/${declaration}`), `Missing CommonJS declaration: ${declaration}`);
  assert(packedFiles.has(`esm/${declaration}`), `Missing ESM declaration: ${declaration}`);
}

for (const path of packedFiles) {
  assert(!path.startsWith('src/'), `Source file leaked into package: ${path}`);
  assert(!path.startsWith('fixtures/'), `Fixture leaked into package: ${path}`);
  assert(!path.startsWith('scripts/'), `Build script leaked into package: ${path}`);
  assert(!path.startsWith('tsconfig'), `TypeScript config leaked into package: ${path}`);
}

console.log(`Gate 0 package verification passed (${packedFiles.size} files).`);
