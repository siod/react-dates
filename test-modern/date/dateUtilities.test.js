import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import compareDates from '../../src/utils/compareDates';
import getCalendarMonthWeeks from '../../src/utils/getCalendarMonthWeeks';
import isDayVisible from '../../src/utils/isDayVisible';
import isDateTime from '../../src/utils/isDateTime';
import isNextDay from '../../src/utils/isNextDay';
import isNextMonth from '../../src/utils/isNextMonth';
import isPreviousDay from '../../src/utils/isPreviousDay';
import isPrevMonth from '../../src/utils/isPrevMonth';
import isSameMonth from '../../src/utils/isSameMonth';
import toISODateString from '../../src/utils/toISODateString';
import toISOMonthString from '../../src/utils/toISOMonthString';

const date = (value) => DateTime.fromISO(value);

describe('DateTime-native date utilities', () => {
  it('owns DateTime validation and calendar-day comparison', () => {
    expect(isDateTime(date('2024-02-29'))).toBe(true);
    expect(isDateTime(DateTime.invalid('test'))).toBe(false);
    expect(compareDates(date('2024-02-29'), date('2024-03-01'))).toBe(-1);
    expect(compareDates(date('2024-02-29'), date('2024-02-29'))).toBe(0);
    expect(compareDates('2024-02-29', date('2024-02-29'))).toBeNull();
  });

  it('compares adjacent days and months with Luxon arithmetic', () => {
    expect(isNextDay(date('2024-02-29'), date('2024-03-01'))).toBe(true);
    expect(isPreviousDay(date('2024-03-01'), date('2024-02-29'))).toBe(true);
    expect(isSameMonth(date('2024-02-01'), date('2024-02-29'))).toBe(true);
    expect(isNextMonth(date('2024-02-29'), date('2024-03-15'))).toBe(true);
    expect(isPrevMonth(date('2024-03-15'), date('2024-02-29'))).toBe(true);
  });

  it('keeps ISO conversion at key/serialization helpers', () => {
    expect(toISODateString(date('2024-02-29'))).toBe('2024-02-29');
    expect(toISOMonthString(date('2024-02-29'))).toBe('2024-02');
    expect(toISODateString('2024-02-29')).toBeNull();
  });

  it('checks visible ranges with DateTimes, including outside days', () => {
    const month = date('2024-02-01');
    expect(isDayVisible(date('2024-02-29'), month, 1, false)).toBe(true);
    expect(isDayVisible(date('2024-01-29'), month, 1, true)).toBe(true);
    expect(isDayVisible(date('2024-01-27'), month, 1, true)).toBe(false);
    expect(isDayVisible('2024-02-01', month, 1, false)).toBe(false);
  });

  it('builds locale-aligned calendar grids', () => {
    const weeks = getCalendarMonthWeeks(date('2024-02-01').setLocale('en-GB'), {
      enableOutsideDays: true,
    });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0].toISODate()).toBe('2024-01-29');
  });
});
