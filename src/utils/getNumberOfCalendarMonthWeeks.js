import { getCalendarMonthWeeks } from '../internal/date';

export default function getNumberOfCalendarMonthWeeks(month, firstDayOfWeek) {
  return getCalendarMonthWeeks(month, { firstDayOfWeek }).length;
}
