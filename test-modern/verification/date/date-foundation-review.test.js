import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import {
  formatDate,
  getCalendarMonthWeeks,
  getWeekdayLabels,
  isDateTime,
  parseLocalizedDate,
  startOfWeek,
} from '../../../src/internal/date';

const date = (value, options) => DateTime.fromISO(value, options);
const iso = (value) => value?.toISODate();

describe('independent DateTime-foundation verification', () => {
  it('rejects strings and invalid DateTimes at the public boundary', () => {
    ['', '2024-02-29', 20240201, null, undefined, DateTime.invalid('test')]
      .forEach((value) => expect(isDateTime(value)).toBe(false));
    ['0001-01-01', '1900-02-28', '2000-02-29', '2024-02-29', '2099-12-31']
      .forEach((value) => expect(isDateTime(date(value))).toBe(true));
  });

  it('round-trips a broad set of dates through day/month arithmetic', () => {
    for (let year = 1900; year <= 2100; year += 10) {
      for (let month = 1; month <= 12; month += 1) {
        const value = date(`${year}-${String(month).padStart(2, '0')}-15`);
        expect(isDateTime(value)).toBe(true);
        expect(iso(value.plus({ days: 31 }).minus({ days: 31 }))).toBe(iso(value));
        expect(isDateTime(value.plus({ months: 1 }))).toBe(true);
        expect(isDateTime(value.minus({ months: 1 }))).toBe(true);
      }
    }
    expect(iso(date('2024-02-28').plus({ days: 1 }))).toBe('2024-02-29');
    expect(iso(date('2024-02-29').plus({ days: 1 }))).toBe('2024-03-01');
    expect(iso(date('1900-02-28').plus({ days: 1 }))).toBe('1900-03-01');
    expect(iso(date('2000-02-28').plus({ days: 1 }))).toBe('2000-02-29');
  });

  it('round-trips Intl formatted dates across locale patterns and digits', () => {
    [
      ['en-US', { dateStyle: 'short' }, '2024-07-08'],
      ['en-GB', { dateStyle: 'medium' }, '2024-11-23'],
      ['de-DE', { year: 'numeric', month: 'long', day: 'numeric' }, '2024-03-05'],
      ['ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }, '2024-12-31'],
    ].forEach(([locale, options, value]) => {
      const formatOptions = { locale, ...options };
      const formatted = formatDate(date(value), formatOptions);
      expect(formatted).not.toBe('');
      expect(iso(parseLocalizedDate(formatted, formatOptions))).toBe(value);
    });
  });

  it('keeps localized formatting on the Gregorian calendar', () => {
    const options = {
      locale: 'th-TH', calendar: 'buddhist',
      year: 'numeric', month: 'long', day: 'numeric',
    };
    const formatted = formatDate(date('2024-03-20'), options);
    expect(formatted).toContain('2024');
    expect(formatted).not.toContain('2567');
    expect(iso(parseLocalizedDate(formatted, options))).toBe('2024-03-20');
  });

  it('uses locale week starts and labels', () => {
    const sunday = date('2024-01-07');
    expect(iso(startOfWeek(sunday, { locale: 'en-US' }))).toBe('2024-01-07');
    expect(iso(startOfWeek(sunday, { locale: 'en-GB' }))).toBe('2024-01-01');
    expect(iso(startOfWeek(sunday, { firstDayOfWeek: 3 }))).toBe('2024-01-03');
    expect(getWeekdayLabels({ locale: 'en-US' })).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(getWeekdayLabels({ locale: 'en-GB' })).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    getCalendarMonthWeeks(date('2024-02-01'), { locale: 'en-GB', enableOutsideDays: true })
      .forEach((week) => expect(week).toHaveLength(7));
  });

  it('preserves zones and calendar-day arithmetic across DST shifts', () => {
    [
      ['UTC', '2024-03-10'],
      ['America/New_York', '2024-03-10'],
      ['Europe/London', '2024-03-31'],
      ['Australia/Brisbane', '2024-10-06'],
    ].forEach(([zone, value]) => {
      const zoned = date(value, { zone });
      const next = zoned.plus({ days: 1 });
      expect(next.zoneName).toBe(zone);
      expect(iso(next)).toBe(iso(zoned.plus({ days: 1 })));
      expect(getCalendarMonthWeeks(zoned, { firstDayOfWeek: 1 }).flat().filter(Boolean)
        .some((dayValue) => dayValue.hasSame(zoned, 'day'))).toBe(true);
    });
  });
});
