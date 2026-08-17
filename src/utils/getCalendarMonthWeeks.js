import { getFirstDayOfWeek } from '../internal/date';
import isDateTime from './isDateTime';

export default function getCalendarMonthWeeks(
  month,
  enableOutsideDaysOrOptions = false,
  firstDayOfWeek,
) {
  const options = enableOutsideDaysOrOptions !== null
    && typeof enableOutsideDaysOrOptions === 'object'
    ? enableOutsideDaysOrOptions
    : { enableOutsideDays: enableOutsideDaysOrOptions, firstDayOfWeek };
  if (!isDateTime(month)) return [];
  const firstDay = getFirstDayOfWeek({
    ...options,
    locale: options.locale || month.locale,
  });
  if (firstDay == null) return [];

  const includeOutsideDays = Boolean(options.enableOutsideDays);
  const first = month.startOf('month');
  const last = month.endOf('month');
  const before = (first.weekday % 7 - firstDay + 7) % 7;
  const after = (firstDay + 6 - (last.weekday % 7) + 7) % 7;
  const start = first.minus({ days: before });
  const total = before + last.day + after;
  const weeks = [];

  for (let index = 0; index < total; index += 1) {
    if (index % 7 === 0) weeks.push([]);
    const current = start.plus({ days: index });
    weeks[weeks.length - 1].push(
      includeOutsideDays || current.hasSame(first, 'month') ? current : null,
    );
  }
  return weeks;
}
