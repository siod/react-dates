import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';

export default function isSameDay(a: DateTime | null, b: DateTime | null): boolean {
  if (a === b) return isDateTime(a);
  if (!isDateTime(a) || !isDateTime(b)) return false;
  return a.day === b.day
    && a.month === b.month
    && a.year === b.year;
}
