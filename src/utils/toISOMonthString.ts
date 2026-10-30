import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';

export default function toISOMonthString(date?: DateTime | null) {
  return isDateTime(date) ? date.toFormat('yyyy-MM') : null;
}
