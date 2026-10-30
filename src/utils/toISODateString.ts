import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';

export default function toISODateString(date?: DateTime | null) {
  return isDateTime(date) ? date.toISODate() : null;
}
