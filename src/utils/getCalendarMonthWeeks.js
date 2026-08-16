import { getCalendarMonthWeeks as getWeeks } from '../internal/date';

export default function getCalendarMonthWeeks(
  month,
  enableOutsideDaysOrOptions = false,
  firstDayOfWeek,
) {
  const options = typeof enableOutsideDaysOrOptions === 'object'
    ? enableOutsideDaysOrOptions
    : { enableOutsideDays: enableOutsideDaysOrOptions, firstDayOfWeek };
  return getWeeks(month, options);
}
