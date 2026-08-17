import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import {
  formatDate,
  getFirstDayOfWeek,
  getWeekdayLabels,
  parseLocalizedDate,
  startOfWeek,
} from '../../src/internal/date';
import { dateTime as dateTimePropType } from '../../src/internal/date/dateTimePropType';
import compareDates from '../../src/utils/compareDates';
import getCalendarMonthWeeks from '../../src/utils/getCalendarMonthWeeks';
import isDateTime from '../../src/utils/isDateTime';

const date = (value, options) => DateTime.fromISO(value, options);
const iso = (value) => value?.toISODate();

describe('Luxon DateTime foundation', () => {
  it('accepts valid DateTimes and rejects other public date values', () => {
    expect(isDateTime(date('2024-02-29'))).toBe(true);
    expect(isDateTime(DateTime.invalid('test'))).toBe(false);
    expect(isDateTime('2024-02-29')).toBe(false);
  });

  it('uses Luxon for leap-year arithmetic', () => {
    expect(iso(date('2024-02-28').plus({ days: 1 }))).toBe('2024-02-29');
    expect(iso(date('2024-02-29').plus({ days: 1 }))).toBe('2024-03-01');
    expect(iso(date('2024-01-31').plus({ months: 1 }))).toBe('2024-02-29');
    expect(iso(date('2024-02-22').plus({ weeks: 1 }))).toBe('2024-02-29');
    expect(iso(date('2024-02-29').startOf('month'))).toBe('2024-02-01');
    expect(iso(date('2024-02-01').endOf('month'))).toBe('2024-02-29');
    expect(compareDates(date('2024-01-01'), date('2023-12-31'))).toBe(1);
    expect(compareDates(date('2024-02-15'), date('2024-02-01'))).toBe(1);
    expect(compareDates(date('2024-02-15'), date('2024-02-29'))).toBe(-1);
  });

  it('projects calendar weeks and locale weekday order', () => {
    expect(iso(startOfWeek(date('2024-01-03'), { firstDayOfWeek: 1 }))).toBe('2024-01-01');
    expect(iso(date('2024-01-03').minus({ days: 3 }))).toBe('2023-12-31');
    expect(getFirstDayOfWeek({ locale: 'en-US' })).toBe(0);
    const weeks = getCalendarMonthWeeks(date('2024-02-01'), {
      firstDayOfWeek: 1,
      enableOutsideDays: true,
    });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(iso(weeks[0][0])).toBe('2024-01-29');
    expect(getWeekdayLabels({ locale: 'en-US', firstDayOfWeek: 0 })).toEqual([
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    ]);
  });

  it('formats and parses locale dates as DateTimes', () => {
    const formatted = formatDate(date('2024-07-08'), { locale: 'en-US', dateStyle: 'short' });
    expect(iso(parseLocalizedDate(formatted, { locale: 'en-US', dateStyle: 'short' })))
      .toBe('2024-07-08');
    expect(formatDate(date('2024-07-08'), {
      locale: 'en-US', month: 'long', year: 'numeric',
    })).toBe('July 2024');
  });

  it('forces Gregorian display and preserves DateTime zones across DST', () => {
    const localized = formatDate(date('2024-03-20'), {
      locale: 'th-TH', calendar: 'buddhist',
      year: 'numeric', month: 'long', day: 'numeric',
    });
    expect(localized).toContain('2024');
    expect(localized).not.toContain('2567');
    expect(iso(parseLocalizedDate(localized, {
      locale: 'th-TH', calendar: 'buddhist',
      year: 'numeric', month: 'long', day: 'numeric',
    }))).toBe('2024-03-20');
    expect(formatDate(date('2024-03-20'), {
      locale: 'ar-EG', numberingSystem: 'latn', year: 'numeric',
    })).toContain('٢٠٢٤');

    [
      ['UTC', '2024-03-10'],
      ['America/New_York', '2024-03-10'],
      ['Europe/London', '2024-03-31'],
      ['Australia/Brisbane', '2024-10-06'],
    ].forEach(([zone, value]) => {
      const zoned = date(value, { zone });
      expect(zoned.isValid).toBe(true);
      expect(zoned.plus({ days: 1 }).zoneName).toBe(zone);
      expect(zoned.plus({ months: 1 }).zoneName).toBe(zone);
      expect(getCalendarMonthWeeks(zoned, { firstDayOfWeek: 1 }).flat().filter(Boolean)
        .some((dayValue) => dayValue.hasSame(zoned, 'day'))).toBe(true);
      expect(formatDate(zoned, { locale: 'en-CA', dateStyle: 'short' })).not.toBe('');
    });
  });

  it('provides optional and required DateTime PropTypes', () => {
    expect(dateTimePropType({ date: undefined }, 'date', 'Example')).toBeNull();
    expect(dateTimePropType({ date: date('2024-02-29') }, 'date', 'Example')).toBeNull();
    expect(dateTimePropType({ date: '2024-02-29' }, 'date', 'Example')).toBeInstanceOf(TypeError);
    expect(dateTimePropType.isRequired({ date: null }, 'date', 'Example')).toBeInstanceOf(TypeError);
    expect(dateTimePropType.isRequired({ date: date('2024-02-29') }, 'date', 'Example')).toBeNull();
  });
});
