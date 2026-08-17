import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';

import { DateTime } from 'luxon';
import * as api from 'react-dates';
import * as constants from 'react-dates/constants';
import DefaultTheme from 'react-dates/esm/theme/DefaultTheme';
import CalendarDay from 'react-dates/esm/components/CalendarDay';

await import('react-dates/initialize');

if (!api.SingleDatePicker) throw new Error('ESM root export is unusable.');
if (typeof constants.DEFAULT_INPUT_FORMAT !== 'object') throw new Error('ESM constants are unusable.');
if (!DefaultTheme || !CalendarDay) throw new Error('ESM deep imports are unusable.');

const require = createRequire(import.meta.url);
const fixtureModules = `${resolve(process.cwd(), 'node_modules')}${sep}`;
if (!require.resolve('luxon').startsWith(fixtureModules)) {
  throw new Error('Luxon resolved outside the isolated ESM consumer.');
}
if (!require.resolve('react-dates/css')) throw new Error('ESM CSS alias is not resolvable.');
if (!DateTime.fromISO('2030-06-15').isValid) throw new Error('ESM Luxon peer is unusable.');

console.log('ESM packed fixture passed.');
