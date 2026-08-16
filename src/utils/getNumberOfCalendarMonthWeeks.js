import getCalendarMonthWeeks from './getCalendarMonthWeeks';

export default function getNumberOfCalendarMonthWeeks(month, firstDayOfWeek) {
  return getCalendarMonthWeeks(month, { firstDayOfWeek }).length;
}
