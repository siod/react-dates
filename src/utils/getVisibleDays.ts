import type { DateTime } from 'luxon';

import getCalendarMonthWeeks from './getCalendarMonthWeeks.js';
import isDateTime from './isDateTime.js';
import toISOMonthString from './toISOMonthString.js';

export type VisibleDays = Record<string, DateTime<true>[]>;

export default function getVisibleDays(
  month: DateTime | null | undefined,
  numberOfMonths: number,
  enableOutsideDays: boolean,
  withoutTransitionMonths = false,
): VisibleDays {
  if (!isDateTime(month) || !Number.isInteger(numberOfMonths) || numberOfMonths < 1) return {};
  const visibleDaysByMonth: VisibleDays = {};
  let currentMonth = month.plus({ months: withoutTransitionMonths ? 0 : -1 });
  const count = withoutTransitionMonths ? numberOfMonths : numberOfMonths + 2;
  for (let index = 0; index < count; index += 1) {
    const weeks = getCalendarMonthWeeks(currentMonth, { enableOutsideDays });
    const monthKey = toISOMonthString(currentMonth);
    if (monthKey) {
      visibleDaysByMonth[monthKey] = weeks.flat().filter(isDateTime);
    }
    currentMonth = currentMonth.plus({ months: 1 });
  }
  return visibleDaysByMonth;
}
