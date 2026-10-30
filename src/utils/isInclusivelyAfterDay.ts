import type { DateTime } from 'luxon';

import compareDates from './compareDates.js';

export default function isInclusivelyAfterDay(
  first: DateTime | null | undefined,
  second: DateTime | null | undefined,
) {
  const comparison = compareDates(first, second);
  return comparison === 0 || comparison === 1;
}
