import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';

let previousMonthKey: string | undefined;
let previousMonthValue: DateTime<true> | null = null;

export default function getPreviousMonthMemoLast(
  month: DateTime | null | undefined,
): DateTime<true> | null {
  const validMonth = isDateTime(month) ? month : null;
  const monthKey = validMonth?.toISODate();
  if (monthKey !== previousMonthKey) {
    previousMonthKey = monthKey;
    previousMonthValue = validMonth?.plus({ months: -1 }) || null;
  }
  return previousMonthValue;
}
