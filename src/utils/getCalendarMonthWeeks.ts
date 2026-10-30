import type { DateTime } from 'luxon';

import {
  getFirstDayOfWeek,
  type DateAdapterOptions,
} from '../internal/date/index.js';
import isDateTime from './isDateTime.js';

export interface CalendarMonthWeekOptions extends DateAdapterOptions {
  enableOutsideDays?: boolean;
}

export type CalendarWeek = Array<DateTime<true> | null>;

export default function getCalendarMonthWeeks(
  month: DateTime | null | undefined,
  enableOutsideDaysOrOptions: boolean | CalendarMonthWeekOptions | null = false,
  firstDayOfWeek?: number | null,
): CalendarWeek[] {
  const options: CalendarMonthWeekOptions = enableOutsideDaysOrOptions !== null
    && typeof enableOutsideDaysOrOptions === 'object'
    ? enableOutsideDaysOrOptions
    : { enableOutsideDays: Boolean(enableOutsideDaysOrOptions), firstDayOfWeek };
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
  const weeks: CalendarWeek[] = [];

  for (let index = 0; index < total; index += 1) {
    if (index % 7 === 0) weeks.push([]);
    const current = start.plus({ days: index });
    weeks[weeks.length - 1].push(
      includeOutsideDays || current.hasSame(first, 'month') ? current : null,
    );
  }
  return weeks;
}
