import type { DateTime } from 'luxon';

import compareDates from './compareDates.js';
import isDateTime from './isDateTime.js';

export default function isNextDay(
  first: DateTime | null | undefined,
  second: DateTime | null | undefined,
) {
  return isDateTime(first) && compareDates(first.plus({ days: 1 }), second) === 0;
}
