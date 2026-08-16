import { createRequire } from 'node:module';

import * as api from 'react-dates';
import * as constants from 'react-dates/constants';
import DefaultTheme from 'react-dates/esm/theme/DefaultTheme';
import CalendarDay from 'react-dates/esm/components/CalendarDay';

await import('react-dates/initialize');

if (!api.SingleDatePicker) throw new Error('ESM root export is unusable.');
if (typeof constants.DEFAULT_INPUT_FORMAT !== 'object') throw new Error('ESM constants are unusable.');
if (!DefaultTheme || !CalendarDay) throw new Error('ESM deep imports are unusable.');

const require = createRequire(import.meta.url);
if (!require.resolve('react-dates/css')) throw new Error('ESM CSS alias is not resolvable.');

console.log('ESM packed fixture passed.');
