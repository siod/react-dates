const { createRequire } = require('node:module');
const { resolve, sep } = require('node:path');

const requireFromFixture = createRequire(__filename);
const api = requireFromFixture('react-dates');
const constants = requireFromFixture('react-dates/constants');
const CalendarDay = requireFromFixture('react-dates/lib/components/CalendarDay');
const { DateTime } = requireFromFixture('luxon');

function assertDefaultThemeIsNotExported() {
  try {
    requireFromFixture.resolve('react-dates/lib/theme/DefaultTheme');
  } catch (error) {
    if (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') return;
    throw error;
  }
  throw new Error('The removed DefaultTheme deep import is still resolvable.');
}

const fixtureModules = `${resolve(process.cwd(), 'node_modules')}${sep}`;
if (!requireFromFixture.resolve('luxon').startsWith(fixtureModules)) {
  throw new Error('Luxon resolved outside the isolated CommonJS consumer.');
}

if (!api || typeof api !== 'object') throw new Error('CommonJS root export is not an object.');
if (typeof constants.DEFAULT_INPUT_FORMAT !== 'object') {
  throw new Error('CommonJS constants export is missing DEFAULT_INPUT_FORMAT.');
}
if (!requireFromFixture.resolve('react-dates/initialize')) {
  throw new Error('CommonJS initialize entrypoint is not resolvable.');
}
if (!requireFromFixture.resolve('react-dates/lib/css/_datepicker.css')) {
  throw new Error('CommonJS CSS entrypoint is not resolvable.');
}
if (!CalendarDay.default) throw new Error('CommonJS component deep imports are not usable.');
assertDefaultThemeIsNotExported();
if (!DateTime.fromISO('2030-06-15').isValid) throw new Error('CommonJS Luxon peer is unusable.');

console.log('CommonJS packed fixture passed.');
