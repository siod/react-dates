import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  formatDate,
  getCalendarMonthWeeks,
  getWeekdayLabels,
  isCanonicalDate,
  parseLocalizedDate,
  startOfWeek,
} from '../../../src/internal/date';

describe('independent date-foundation verification', () => {
  it('rejects malformed and impossible canonical values', () => {
    [
      '', '2024-2-01', '24-02-01', '2024/02/01', '2024-00-01', '2024-01-00',
      '2024-04-31', '2023-02-29', '2024-02-30', '2024-02-01T00:00:00Z',
      20240201, null, undefined,
    ].forEach((value) => expect(isCanonicalDate(value)).toBe(false));
    ['0001-01-01', '1900-02-28', '2000-02-29', '2024-02-29', '2099-12-31'].forEach((value) => {
      expect(isCanonicalDate(value)).toBe(true);
    });
  });

  it('round-trips a broad set of valid dates through day/month arithmetic', () => {
    for (let year = 1900; year <= 2100; year += 10) {
      for (let month = 1; month <= 12; month += 1) {
        const date = `${year}-${String(month).padStart(2, '0')}-15`;
        expect(isCanonicalDate(date)).toBe(true);
        expect(addDays(addDays(date, 31), -31)).toBe(date);
        expect(isCanonicalDate(addMonths(date, 1))).toBe(true);
        expect(isCanonicalDate(addMonths(date, -1))).toBe(true);
      }
    }
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('1900-02-28', 1)).toBe('1900-03-01');
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29');
  });

  it('round-trips Intl formatted dates across locale patterns and numbering systems', () => {
    [
      ['en-US', { dateStyle: 'short' }, '2024-07-08'],
      ['en-GB', { dateStyle: 'medium' }, '2024-11-23'],
      ['de-DE', { year: 'numeric', month: 'long', day: 'numeric' }, '2024-03-05'],
      ['ar-EG', { year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'arab' }, '2024-12-31'],
    ].forEach(([locale, options, date]) => {
      const formatOptions = { locale, ...options };
      const formatted = formatDate(date, formatOptions);
      expect(formatted).not.toBe('');
      expect(parseLocalizedDate(formatted, formatOptions)).toBe(date);
    });
  });

  it('keeps localized formatting on the Gregorian calendar', () => {
    const options = {
      locale: 'th-TH', calendar: 'buddhist', numberingSystem: 'latn',
      year: 'numeric', month: 'long', day: 'numeric',
    };
    const formatted = formatDate('2024-03-20', options);
    expect(formatted).toContain('2024');
    expect(formatted).not.toContain('2567');
    expect(parseLocalizedDate(formatted, options)).toBe('2024-03-20');
  });

  it('uses locale week starts and labels', () => {
    expect(startOfWeek('2024-01-07', { locale: 'en-US' })).toBe('2024-01-07');
    expect(startOfWeek('2024-01-07', { locale: 'en-GB' })).toBe('2024-01-01');
    expect(startOfWeek('2024-01-07', { firstDayOfWeek: 3 })).toBe('2024-01-03');
    expect(getWeekdayLabels({ locale: 'en-US' })).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(getWeekdayLabels({ locale: 'en-GB' })).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    getCalendarMonthWeeks('2024-02-01', { locale: 'en-GB', enableOutsideDays: true }).forEach((week) => {
      expect(week).toHaveLength(7);
    });
  });

  it('keeps date-only behavior invariant around real IANA timezone boundaries', () => {
    [
      ['UTC', '2024-03-10'],
      ['America/New_York', '2024-03-10'],
      ['Europe/London', '2024-03-31'],
      ['Australia/Brisbane', '2024-10-06'],
      ['Pacific/Apia', '2011-12-30'],
    ].forEach(([timeZone, date]) => {
      const options = { locale: 'en-US', timeZone, dateStyle: 'short' };
      const formatted = formatDate(date, options);
      expect(parseLocalizedDate(formatted, options)).toBe(date);
      expect(addDays(date, 1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(getCalendarMonthWeeks(date, { firstDayOfWeek: 1 }).flat().filter(Boolean)).toContain(date);
    });
  });
});
