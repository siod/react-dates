import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  addWeeks,
  compareDates,
  endOfMonth,
  formatDate,
  getCalendarMonthWeeks,
  getMonthLabel,
  getFirstDayOfWeek,
  getWeekdayLabels,
  isCanonicalDate,
  isBetween,
  parseDate,
  parseLocalizedDate,
  projectCalendarParts,
  startOfMonth,
  startOfWeek,
  setWeekday,
} from '../../src/internal/date';
import { isoDate as isoDatePropType } from '../../src/internal/date/isoDatePropType';

describe('private Luxon date foundation', () => {
  it('strictly validates canonical and impossible dates', () => {
    expect(isCanonicalDate('2024-02-29')).toBe(true);
    expect(isCanonicalDate('2023-02-29')).toBe(false);
    expect(isCanonicalDate('2024-2-09')).toBe(false);
    expect(parseDate('2024-13-01')).toBeNull();
  });

  it('does date-only leap-year arithmetic in UTC', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addWeeks('2024-02-22', 1)).toBe('2024-02-29');
    expect(startOfMonth('2024-02-29')).toBe('2024-02-01');
    expect(endOfMonth('2024-02-01')).toBe('2024-02-29');
    expect(compareDates('2024-01-01', '2023-12-31')).toBe(1);
    expect(isBetween('2024-02-15', '2024-02-01', '2024-02-29')).toBe(true);
  });

  it('projects calendar weeks and locale weekday order', () => {
    expect(startOfWeek('2024-01-03', { firstDayOfWeek: 1 })).toBe('2024-01-01');
    expect(setWeekday('2024-01-03', 0)).toBe('2023-12-31');
    expect(getFirstDayOfWeek({ locale: 'en-US' })).toBe(0);
    const weeks = getCalendarMonthWeeks('2024-02-01', {
      firstDayOfWeek: 1,
      enableOutsideDays: true,
    });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0]).toBe('2024-01-29');
    expect(getWeekdayLabels({ locale: 'en-US', firstDayOfWeek: 0 })).toEqual([
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    ]);
  });

  it('formats and parses locale dates without exposing Luxon', () => {
    const formatted = formatDate('2024-07-08', { locale: 'en-US', dateStyle: 'short' });
    expect(parseLocalizedDate(formatted, { locale: 'en-US', dateStyle: 'short' })).toBe('2024-07-08');
    expect(getMonthLabel('2024-07-08', { locale: 'en-US' })).toBe('July 2024');
    expect(projectCalendarParts('2024-07-08', { locale: 'en-US' })).toMatchObject({
      year: 2024,
      month: 7,
      day: 8,
    });
  });

  it('supports Persian display and real timezone-independent dates', () => {
    const persian = formatDate('2024-03-20', {
      locale: 'fa-IR', calendar: 'persian', numberingSystem: 'arabext',
      year: 'numeric', month: 'long', day: 'numeric',
    });
    expect(persian).toContain('۱۴۰۳');
    expect(projectCalendarParts('2024-03-20', { locale: 'fa-IR', calendar: 'persian' }))
      .toMatchObject({ year: 1403, month: 1, day: 1 });
    const parsedPersian = parseLocalizedDate(persian, {
      locale: 'fa-IR', calendar: 'persian', numberingSystem: 'arabext',
      year: 'numeric', month: 'long', day: 'numeric',
    });
    expect(parsedPersian).toBe('2024-03-20');
    [
      ['UTC', '2024-03-10'],
      ['America/New_York', '2024-03-10'],
      ['Europe/London', '2024-03-31'],
      ['Australia/Brisbane', '2024-10-06'],
      ['Pacific/Apia', '2011-12-30'], // skipped by the zone, valid as a date-only value
    ].forEach(([zone, date]) => {
      const options = {
        locale: 'en-CA', timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      };
      expect(addDays(date, 1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(addMonths(date, 1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(getCalendarMonthWeeks(date, { firstDayOfWeek: 1 }).flat().filter(Boolean))
        .toContain(date);
      expect(parseLocalizedDate(formatDate(date, options), options)).toBe(date);
    });
  });

  it('provides optional and required canonical ISO PropTypes', () => {
    expect(isoDatePropType({ date: undefined }, 'date', 'Example')).toBeNull();
    expect(isoDatePropType({ date: '2024-02-29' }, 'date', 'Example')).toBeNull();
    expect(isoDatePropType({ date: '2024-02-30' }, 'date', 'Example')).toBeInstanceOf(TypeError);
    expect(isoDatePropType.isRequired({ date: null }, 'date', 'Example')).toBeInstanceOf(TypeError);
    expect(isoDatePropType.isRequired({ date: '2024-02-29' }, 'date', 'Example')).toBeNull();
  });
});
