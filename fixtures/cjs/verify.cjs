const { createRequire } = require('node:module');

const requireFromFixture = createRequire(__filename);
const api = requireFromFixture('react-dates');
const constants = requireFromFixture('react-dates/constants');
const DefaultTheme = requireFromFixture('react-dates/lib/theme/DefaultTheme');
const CalendarDay = requireFromFixture('react-dates/lib/components/CalendarDay');

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
if (!DefaultTheme.default || !CalendarDay.default) {
  throw new Error('CommonJS compatibility deep imports are not usable.');
}

console.log('CommonJS packed fixture passed.');
