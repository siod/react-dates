import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';

import { DateTime } from 'luxon';
import * as api from '@siod/react-dates';
import * as constants from '@siod/react-dates/constants';
import CalendarDay from '@siod/react-dates/esm/components/CalendarDay';

await import('@siod/react-dates/initialize');

if (!api.SingleDatePicker) throw new Error('ESM root export is unusable.');
if (typeof constants.DEFAULT_INPUT_FORMAT !== 'object') throw new Error('ESM constants are unusable.');
if (!CalendarDay) throw new Error('ESM component deep imports are unusable.');

try {
  await import('@siod/react-dates/esm/theme/DefaultTheme');
  throw new Error('The removed DefaultTheme deep import is still resolvable.');
} catch (error) {
  if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
}

const require = createRequire(import.meta.url);
const fixtureModules = `${resolve(process.cwd(), 'node_modules')}${sep}`;
if (!require.resolve('luxon').startsWith(fixtureModules)) {
  throw new Error('Luxon resolved outside the isolated ESM consumer.');
}
if (!require.resolve('@siod/react-dates/css')) throw new Error('ESM CSS alias is not resolvable.');
if (!DateTime.fromISO('2030-06-15').isValid) throw new Error('ESM Luxon peer is unusable.');

console.log('ESM packed fixture passed.');
