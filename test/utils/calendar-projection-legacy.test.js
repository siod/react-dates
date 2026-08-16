import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import getCalendarMonthWeeks from '../../src/utils/getCalendarMonthWeeks';
import getNumberOfCalendarMonthWeeks from '../../src/utils/getNumberOfCalendarMonthWeeks';
import getVisibleDays from '../../src/utils/getVisibleDays';
import isDayVisible from '../../src/utils/isDayVisible';
import isDateTime from '../../src/utils/isDateTime';

const date = (value, zone = 'UTC', locale = 'en-US') => (
  DateTime.fromISO(value, { zone }).setLocale(locale)
);

const nonNullDays = (weeks) => weeks.flat().filter(Boolean);

const isoDates = (days) => days.map((day) => day.toISODate());

describe('calendar projection utility compatibility', () => {
  describe('getCalendarMonthWeeks', () => {
    it('returns an empty projection for invalid DateTime inputs', () => {
      [null, '2024-02-01', new Date(), DateTime.invalid('invalid')].forEach((value) => {
        expect(getCalendarMonthWeeks(value)).toEqual([]);
      });
    });

    it('returns an empty projection for invalid first-day indices', () => {
      const month = date('2024-02-01');

      [-1, 7, '0', 1.5].forEach((firstDayOfWeek) => {
        expect(getCalendarMonthWeeks(month, false, firstDayOfWeek)).toEqual([]);
      });

      // `null` now means "not specified" and therefore falls back to the
      // DateTime locale. Legacy Moment tests treated it as invalid input.
      expect(getCalendarMonthWeeks(month, false, null)).not.toEqual([]);
    });

    it('returns seven-column DateTime weeks with each calendar day exactly once', () => {
      const month = date('2024-02-01', 'America/New_York');
      const weeks = getCalendarMonthWeeks(month, {
        enableOutsideDays: false,
        firstDayOfWeek: 0,
      });
      const days = nonNullDays(weeks);

      expect(weeks.every((week) => week.length === 7)).toBe(true);
      expect(days.every((day) => isDateTime(day))).toBe(true);
      expect(days.every((day) => day.zoneName === 'America/New_York')).toBe(true);
      expect(new Set(isoDates(days)).size).toBe(29);
      expect(days[0].toISODate()).toBe('2024-02-01');
      expect(days[days.length - 1].toISODate()).toBe('2024-02-29');
    });

    it('null-pads leading and trailing cells when outside days are disabled', () => {
      const weeks = getCalendarMonthWeeks(date('2017-02-01'), false, 0);
      const firstWeek = weeks[0];
      const lastWeek = weeks[weeks.length - 1];

      expect(firstWeek.slice(0, 3)).toEqual([null, null, null]);
      expect(firstWeek[3].toISODate()).toBe('2017-02-01');
      expect(lastWeek[2].toISODate()).toBe('2017-02-28');
      expect(lastWeek.slice(3)).toEqual([null, null, null, null]);
    });

    it('fills the complete boundary weeks when outside days are enabled', () => {
      const weeks = getCalendarMonthWeeks(date('2017-02-01'), {
        enableOutsideDays: true,
        firstDayOfWeek: 0,
      });
      const days = nonNullDays(weeks);

      expect(weeks.every((week) => week.every((day) => isDateTime(day)))).toBe(true);
      expect(isoDates(days).slice(0, 1)).toEqual(['2017-01-29']);
      expect(isoDates(days).slice(-1)).toEqual(['2017-03-04']);
    });

    it('retains the final day when the following month starts on any weekday', () => {
      [
        ['2016-12-01', 'en-US', 0],
        ['2017-04-01', 'es-ES', 1],
        ['2016-09-01', 'en-US', 0],
      ].forEach(([monthValue, locale, firstDayOfWeek]) => {
        const month = date(monthValue, 'UTC', locale);
        const days = nonNullDays(getCalendarMonthWeeks(month, {
          enableOutsideDays: true,
          firstDayOfWeek,
        }));

        expect(isoDates(days)).toContain(month.endOf('month').toISODate());
        expect(days).toHaveLength(getNumberOfCalendarMonthWeeks(month, firstDayOfWeek) * 7);
      });
    });

    it('keeps leap-year and month-transition boundaries distinct', () => {
      [
        ['1900-02-01', 28],
        ['2000-02-01', 29],
        ['2024-02-01', 29],
        ['2024-12-01', 31],
      ].forEach(([monthValue, expectedDays]) => {
        const days = nonNullDays(getCalendarMonthWeeks(date(monthValue), {
          enableOutsideDays: false,
          firstDayOfWeek: 1,
        }));
        expect(days).toHaveLength(expectedDays);
        expect(new Set(isoDates(days)).size).toBe(expectedDays);
      });

      const december = nonNullDays(getCalendarMonthWeeks(date('2024-12-01'), false, 1));
      expect(december[december.length - 1].toISODate()).toBe('2024-12-31');
    });

    it('honors explicit first-day-of-week positions', () => {
      const january = date('2017-01-01');
      const sundayWeeks = getCalendarMonthWeeks(january, false, 0);
      const wednesdayWeeks = getCalendarMonthWeeks(january, false, 3);

      expect(sundayWeeks[0][0].toISODate()).toBe('2017-01-01');
      expect(sundayWeeks[sundayWeeks.length - 1][2].toISODate()).toBe('2017-01-31');
      expect(wednesdayWeeks[0][4].toISODate()).toBe('2017-01-01');
      expect(wednesdayWeeks[wednesdayWeeks.length - 1][6].toISODate()).toBe('2017-01-31');
    });

    it('uses the DateTime locale when first-day-of-week is omitted', () => {
      const january = date('2017-01-01', 'UTC', 'en-US');
      const januaryMonday = date('2017-01-01', 'UTC', 'en-GB');
      const sundayWeeks = getCalendarMonthWeeks(january, false);
      const mondayWeeks = getCalendarMonthWeeks(januaryMonday, false);

      expect(sundayWeeks[0][0].toISODate()).toBe('2017-01-01');
      expect(sundayWeeks[sundayWeeks.length - 1][2].toISODate()).toBe('2017-01-31');
      expect(mondayWeeks[0][6].toISODate()).toBe('2017-01-01');
      expect(mondayWeeks[mondayWeeks.length - 1][1].toISODate()).toBe('2017-01-31');
    });

    it('does not skip or duplicate days across real timezone transitions', () => {
      [
        ['America/New_York', '2024-03-01', 'en-US'],
        ['Europe/London', '2024-03-01', 'en-GB'],
        ['Australia/Brisbane', '2024-10-01', 'en-AU'],
        ['Pacific/Apia', '2024-03-01', 'en-NZ'],
      ].forEach(([zone, monthValue, locale]) => {
        const month = date(monthValue, zone, locale);
        const days = nonNullDays(getCalendarMonthWeeks(month, {
          enableOutsideDays: false,
          firstDayOfWeek: 1,
        }));

        expect(days.every((day) => day.zoneName === zone)).toBe(true);
        expect(new Set(isoDates(days)).size).toBe(month.daysInMonth);
        expect(isoDates(days)).toContain(month.toISODate());
      });
    });
  });

  describe('getNumberOfCalendarMonthWeeks', () => {
    it('preserves four-, five-, and six-week month projections', () => {
      expect(getNumberOfCalendarMonthWeeks(date('2018-02-01'), 4)).toBe(4);
      expect(getNumberOfCalendarMonthWeeks(date('2018-07-01'), 0)).toBe(5);
      expect(getNumberOfCalendarMonthWeeks(date('2018-09-01'), 0)).toBe(6);
      expect(getNumberOfCalendarMonthWeeks(date('2018-09-01'), 6)).toBe(5);
    });

    it('returns zero for invalid months or week-start values', () => {
      expect(getNumberOfCalendarMonthWeeks(DateTime.invalid('invalid'), 0)).toBe(0);
      expect(getNumberOfCalendarMonthWeeks(date('2018-09-01'), -1)).toBe(0);
      expect(getNumberOfCalendarMonthWeeks(date('2018-09-01'), 7)).toBe(0);
    });
  });

  describe('getVisibleDays', () => {
    it('projects transition months around the requested visible range', () => {
      const month = date('2024-02-01', 'Europe/London', 'en-GB');
      const visibleDays = getVisibleDays(month, 3, false);

      expect(Object.keys(visibleDays)).toEqual([
        '2024-01', '2024-02', '2024-03', '2024-04', '2024-05',
      ]);
      expect(Object.values(visibleDays).every((days) => Array.isArray(days))).toBe(true);
      expect(Object.values(visibleDays).flat().every((day) => isDateTime(day))).toBe(true);
      expect(Object.values(visibleDays).flat().every((day) => day.zoneName === 'Europe/London')).toBe(true);
      expect(Object.values(visibleDays).flat().some((day) => day.toISODate() === '2024-02-01')).toBe(true);
    });

    it('can omit transition months while preserving the requested count', () => {
      const visibleDays = getVisibleDays(date('2024-02-01'), 3, true, true);

      expect(Object.keys(visibleDays)).toEqual(['2024-02', '2024-03', '2024-04']);
      expect(Object.values(visibleDays).every((days) => days.length > 0)).toBe(true);
    });

    it('returns an empty map for invalid projection inputs', () => {
      expect(getVisibleDays(DateTime.invalid('invalid'), 3, false)).toEqual({});
      expect(getVisibleDays(date('2024-02-01'), 0, false)).toEqual({});
      expect(getVisibleDays(date('2024-02-01'), 1.5, false)).toEqual({});
      expect(getVisibleDays(date('2024-02-01'), -1, false)).toEqual({});
    });
  });

  describe('isDayVisible', () => {
    it('recognizes dates inside and outside a multi-month range', () => {
      const month = date('2024-02-01');

      expect(isDayVisible(date('2024-02-29'), month, 2)).toBe(true);
      expect(isDayVisible(date('2024-03-31'), month, 2)).toBe(true);
      expect(isDayVisible(date('2024-01-31'), month, 2)).toBe(false);
      expect(isDayVisible(date('2024-04-01'), month, 2)).toBe(false);
    });

    it('includes only the partial boundary weeks when outside days are enabled', () => {
      const month = date('2019-05-01', 'UTC', 'en-US');

      expect(isDayVisible(date('2019-04-30', 'UTC', 'en-US'), month, 1, false)).toBe(false);
      expect(isDayVisible(date('2019-04-30', 'UTC', 'en-US'), month, 1, true)).toBe(true);
      expect(isDayVisible(date('2019-04-27', 'UTC', 'en-US'), month, 1, true)).toBe(false);
      expect(isDayVisible(date('2019-06-01', 'UTC', 'en-US'), month, 1, true)).toBe(true);
      expect(isDayVisible(date('2019-06-03', 'UTC', 'en-US'), month, 1, true)).toBe(false);
    });

    it('handles a DST boundary represented in an IANA timezone', () => {
      const day = date('2020-03-29', 'Atlantic/Azores');
      const month = date('2020-04-02', 'Atlantic/Azores');

      expect(isDayVisible(day, month, 1, true)).toBe(true);
      expect(isDayVisible(date('2020-03-28', 'Atlantic/Azores'), month, 1, true)).toBe(false);
    });

    it('returns false for invalid dates, months, or month counts', () => {
      const month = date('2024-02-01');

      expect(isDayVisible('2024-02-01', month, 1)).toBe(false);
      expect(isDayVisible(date('2024-02-01'), DateTime.invalid('invalid'), 1)).toBe(false);
      expect(isDayVisible(date('2024-02-01'), month, 0)).toBe(false);
      expect(isDayVisible(date('2024-02-01'), month, 1.5)).toBe(false);
    });
  });
});
