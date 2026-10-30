import type { DateTime } from 'luxon';

import compareDates from './compareDates.js';

export default function isBeforeDay(
  first: DateTime | null | undefined,
  second: DateTime | null | undefined,
) {
  return compareDates(first, second) === -1;
}
