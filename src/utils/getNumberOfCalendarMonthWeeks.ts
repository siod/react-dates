import type { DateTime } from 'luxon';

import getCalendarMonthWeeks from './getCalendarMonthWeeks.js';

export default function getNumberOfCalendarMonthWeeks(
  month: DateTime | null | undefined,
  firstDayOfWeek?: number | null,
) {
  return getCalendarMonthWeeks(month, { firstDayOfWeek }).length;
}
