import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';

export default function isSameMonth(
  first: DateTime | null | undefined,
  second: DateTime | null | undefined,
) {
  return isDateTime(first) && isDateTime(second) && first.hasSame(second, 'month');
}
