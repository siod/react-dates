import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';
import isSameMonth from './isSameMonth.js';

export default function isPrevMonth(
  first: DateTime | null | undefined,
  second: DateTime | null | undefined,
) {
  return isDateTime(first) && isSameMonth(first.minus({ months: 1 }), second);
}
