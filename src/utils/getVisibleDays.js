import { addMonths, getCalendarMonthWeeks } from '../internal/date';
import toISOMonthString from './toISOMonthString';

export default function getVisibleDays(
  month,
  numberOfMonths,
  enableOutsideDays,
  withoutTransitionMonths,
) {
  if (typeof month !== 'string' || !Number.isInteger(numberOfMonths) || numberOfMonths < 1) return {};
  const visibleDaysByMonth = {};
  let currentMonth = addMonths(month, withoutTransitionMonths ? 0 : -1);
  if (!currentMonth) return {};
  const count = withoutTransitionMonths ? numberOfMonths : numberOfMonths + 2;
  for (let index = 0; index < count; index += 1) {
    const weeks = getCalendarMonthWeeks(currentMonth, { enableOutsideDays });
    visibleDaysByMonth[toISOMonthString(currentMonth)] = weeks.flat().filter((day) => day != null);
    currentMonth = addMonths(currentMonth, 1);
  }
  return visibleDaysByMonth;
}
