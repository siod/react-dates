import { createRequire } from 'node:module';

const api = await import('react-dates');
const constants = await import('react-dates/constants');
const requireFromFixture = createRequire(import.meta.url);

if (!api || typeof api !== 'object') throw new Error('ESM root export is not an object.');
if (typeof constants.DEFAULT_INPUT_FORMAT !== 'object') {
  throw new Error('ESM constants export is missing DEFAULT_INPUT_FORMAT.');
}
await import('react-dates/initialize');
if (!requireFromFixture.resolve('react-dates/lib/css/_datepicker.css')) {
  throw new Error('ESM CSS entrypoint is not resolvable.');
}

console.log('ESM packed fixture passed.');
