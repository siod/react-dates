import { getCalendarMonthWeeks, isDateTime } from '../internal/date';
import toISOMonthString from './toISOMonthString';

export default function getVisibleDays(
  month,
  numberOfMonths,
  enableOutsideDays,
  withoutTransitionMonths,
) {
  if (!isDateTime(month) || !Number.isInteger(numberOfMonths) || numberOfMonths < 1) return {};
  const visibleDaysByMonth = {};
  let currentMonth = month.plus({ months: withoutTransitionMonths ? 0 : -1 });
  const count = withoutTransitionMonths ? numberOfMonths : numberOfMonths + 2;
  for (let index = 0; index < count; index += 1) {
    const weeks = getCalendarMonthWeeks(currentMonth, { enableOutsideDays });
    visibleDaysByMonth[toISOMonthString(currentMonth)] = weeks.flat().filter((day) => day != null);
    currentMonth = currentMonth.plus({ months: 1 });
  }
  return visibleDaysByMonth;
}
