import { DateTime } from 'luxon';
import {
  describe, expect, it, vi,
} from 'vitest';

import compareDates from '../../src/utils/compareDates';
import isAfterDay from '../../src/utils/isAfterDay';
import isBeforeDay from '../../src/utils/isBeforeDay';
import isInclusivelyAfterDay from '../../src/utils/isInclusivelyAfterDay';
import isInclusivelyBeforeDay from '../../src/utils/isInclusivelyBeforeDay';
import isNextDay from '../../src/utils/isNextDay';
import isNextMonth from '../../src/utils/isNextMonth';
import isPrevMonth from '../../src/utils/isPrevMonth';
import isPreviousDay from '../../src/utils/isPreviousDay';
import isSameDay from '../../src/utils/isSameDay';
import isSameMonth from '../../src/utils/isSameMonth';

const date = (value, options) => DateTime.fromISO(value, options);
const today = date('2024-02-28');
const tomorrow = date('2024-02-29');
const yesterday = date('2024-02-27');

const invalidDate = DateTime.invalid('legacy comparator test');
const invalidInputs = [null, undefined, '2024-02-28', new Date('2024-02-28'), invalidDate, 42];

describe('legacy calendar-day comparator contracts', () => {
  describe('isAfterDay', () => {
    it.each([
      ['a later day in the same month and year', tomorrow, today],
      ['a later month in the same year', date('2024-03-28'), today],
      ['a later year in the same month and day', date('2025-02-28'), today],
    ])('returns true for %s', (_label, left, right) => {
      expect(isAfterDay(left, right)).toBe(true);
    });

    it.each([
      ['equal days', today, today],
      ['a reversed pair', today, tomorrow],
    ])('returns false for %s', (_label, left, right) => {
      expect(isAfterDay(left, right)).toBe(false);
    });

    it.each([
      ['the first argument', invalidInputs, today],
      ['the second argument', today, invalidInputs],
    ])('returns false for invalid %s', (_label, left, right) => {
      const values = Array.isArray(left) ? left : right;
      values.forEach((value) => {
        expect(isAfterDay(Array.isArray(left) ? value : left, Array.isArray(right) ? value : right))
          .toBe(false);
      });
    });
  });

  describe('isBeforeDay', () => {
    it.each([
      ['an earlier day in the same month and year', today, tomorrow],
      ['an earlier month in the same year', today, date('2024-03-28')],
      ['an earlier year in the same month and day', today, date('2025-02-28')],
    ])('returns true for %s', (_label, left, right) => {
      expect(isBeforeDay(left, right)).toBe(true);
    });

    it.each([
      ['equal days', today, today],
      ['a reversed pair', tomorrow, today],
    ])('returns false for %s', (_label, left, right) => {
      expect(isBeforeDay(left, right)).toBe(false);
    });

    it.each([
      ['the first argument', invalidInputs, today],
      ['the second argument', today, invalidInputs],
    ])('returns false for invalid %s', (_label, left, right) => {
      const values = Array.isArray(left) ? left : right;
      values.forEach((value) => {
        expect(isBeforeDay(Array.isArray(left) ? value : left, Array.isArray(right) ? value : right))
          .toBe(false);
      });
    });
  });

  describe('inclusive day comparisons', () => {
    it.each([
      ['isInclusivelyAfterDay', isInclusivelyAfterDay, tomorrow, today],
      ['isInclusivelyAfterDay for equal days', isInclusivelyAfterDay, today, today],
      ['isInclusivelyBeforeDay', isInclusivelyBeforeDay, today, tomorrow],
      ['isInclusivelyBeforeDay for equal days', isInclusivelyBeforeDay, today, today],
    ])('returns true for %s', (_label, predicate, left, right) => {
      expect(predicate(left, right)).toBe(true);
    });

    it.each([
      ['isInclusivelyAfterDay when the first day is earlier', isInclusivelyAfterDay, today, tomorrow],
      ['isInclusivelyBeforeDay when the first day is later', isInclusivelyBeforeDay, tomorrow, today],
    ])('returns false for %s', (_label, predicate, left, right) => {
      expect(predicate(left, right)).toBe(false);
    });

    it.each([
      ['isInclusivelyAfterDay', isInclusivelyAfterDay],
      ['isInclusivelyBeforeDay', isInclusivelyBeforeDay],
    ])('rejects an invalid first argument for %s', (_label, predicate) => {
      invalidInputs.forEach((value) => expect(predicate(value, today)).toBe(false));
    });

    it.each([
      ['isInclusivelyAfterDay', isInclusivelyAfterDay],
      ['isInclusivelyBeforeDay', isInclusivelyBeforeDay],
    ])('rejects an invalid second argument for %s', (_label, predicate) => {
      invalidInputs.forEach((value) => expect(predicate(today, value)).toBe(false));
    });
  });

  describe('adjacent-day comparisons', () => {
    it('recognizes the next day', () => {
      expect(isNextDay(today, tomorrow)).toBe(true);
    });

    it('rejects a reversed next-day pair', () => {
      expect(isNextDay(tomorrow, today)).toBe(false);
    });

    it('recognizes the previous day', () => {
      expect(isPreviousDay(today, yesterday)).toBe(true);
    });

    it('rejects a reversed previous-day pair', () => {
      expect(isPreviousDay(yesterday, today)).toBe(false);
    });

    it.each([
      ['isNextDay', isNextDay],
      ['isPreviousDay', isPreviousDay],
    ])('rejects an invalid first argument for %s', (_label, predicate) => {
      invalidInputs.forEach((value) => expect(predicate(value, today)).toBe(false));
    });

    it.each([
      ['isNextDay', isNextDay],
      ['isPreviousDay', isPreviousDay],
    ])('rejects an invalid second argument for %s', (_label, predicate) => {
      invalidInputs.forEach((value) => expect(predicate(today, value)).toBe(false));
    });
  });

  describe('adjacent-month comparisons', () => {
    it('recognizes the next month', () => {
      expect(isNextMonth(today, date('2024-03-28'))).toBe(true);
    });

    it.each([
      ['a reversed pair', date('2024-03-28'), today],
      ['a month two months away', today, date('2024-04-28')],
    ])('rejects %s for isNextMonth', (_label, left, right) => {
      expect(isNextMonth(left, right)).toBe(false);
    });

    it('recognizes the previous month', () => {
      expect(isPrevMonth(today, date('2024-01-28'))).toBe(true);
    });

    it.each([
      ['a reversed pair', date('2024-01-28'), today],
      ['a month two months away', today, date('2023-12-28')],
    ])('rejects %s for isPrevMonth', (_label, left, right) => {
      expect(isPrevMonth(left, right)).toBe(false);
    });

    it.each([
      ['isNextMonth', isNextMonth],
      ['isPrevMonth', isPrevMonth],
    ])('rejects an invalid first argument for %s', (_label, predicate) => {
      invalidInputs.forEach((value) => expect(predicate(value, today)).toBe(false));
    });

    it.each([
      ['isNextMonth', isNextMonth],
      ['isPrevMonth', isPrevMonth],
    ])('rejects an invalid second argument for %s', (_label, predicate) => {
      invalidInputs.forEach((value) => expect(predicate(today, value)).toBe(false));
    });
  });

  describe('same-day and same-month comparisons', () => {
    it('recognizes equal days', () => {
      expect(isSameDay(today, today)).toBe(true);
    });

    it('rejects different days', () => {
      expect(isSameDay(today, tomorrow)).toBe(false);
    });

    it('does not confuse equal weekdays with equal dates', () => {
      expect(isSameDay(date('2000-01-01'), date('2000-01-08'))).toBe(false);
    });

    it.each([
      ['the first argument', invalidInputs, today],
      ['the second argument', today, invalidInputs],
    ])('rejects invalid %s for isSameDay', (_label, left, right) => {
      const values = Array.isArray(left) ? left : right;
      values.forEach((value) => {
        expect(isSameDay(Array.isArray(left) ? value : left, Array.isArray(right) ? value : right))
          .toBe(false);
      });
    });

    it('recognizes equal months', () => {
      expect(isSameMonth(today, today)).toBe(true);
    });

    it('rejects different months', () => {
      expect(isSameMonth(today, date('2024-03-28'))).toBe(false);
    });

    it.each([
      ['the first argument', invalidInputs, today],
      ['the second argument', today, invalidInputs],
    ])('rejects invalid %s for isSameMonth', (_label, left, right) => {
      const values = Array.isArray(left) ? left : right;
      values.forEach((value) => {
        expect(isSameMonth(Array.isArray(left) ? value : left, Array.isArray(right) ? value : right))
          .toBe(false);
      });
    });
  });

  describe('DateTime calendar-field semantics', () => {
    it('handles leap-day and year boundaries', () => {
      const leapDay = date('2024-02-29');
      const marchFirst = date('2024-03-01');
      const newYear = date('2025-01-01');

      expect(isNextDay(leapDay, marchFirst)).toBe(true);
      expect(isPreviousDay(marchFirst, leapDay)).toBe(true);
      expect(isAfterDay(newYear, marchFirst)).toBe(true);
      expect(isBeforeDay(marchFirst, newYear)).toBe(true);
    });

    it('compares local calendar fields when zones share the same date', () => {
      const brisbane = date('2024-02-29', { zone: 'Australia/Brisbane' });
      const newYork = date('2024-02-29', { zone: 'America/New_York' });
      const brisbaneToISO = vi.spyOn(brisbane, 'toISODate');
      const newYorkToISO = vi.spyOn(newYork, 'toISODate');

      expect(isSameDay(brisbane, newYork)).toBe(true);
      expect(compareDates(brisbane, newYork)).toBe(0);
      expect(isSameMonth(brisbane, newYork)).toBe(true);
      expect(brisbaneToISO).not.toHaveBeenCalled();
      expect(newYorkToISO).not.toHaveBeenCalled();
    });

    it('distinguishes zones whose local calendar dates differ', () => {
      const instant = date('2024-02-29T00:30:00Z');
      const inNewYork = instant.setZone('America/New_York');

      expect(instant.day).toBe(29);
      expect(inNewYork.day).toBe(28);
      expect(isSameDay(instant, inNewYork)).toBe(false);
      expect(isAfterDay(instant, inNewYork)).toBe(true);
    });

    it('clamps month arithmetic correctly across a leap February', () => {
      const januaryEnd = date('2024-01-31');
      const februaryEnd = date('2024-02-29');
      const marchEnd = date('2024-03-31');

      expect(isNextMonth(januaryEnd, februaryEnd)).toBe(true);
      expect(isPrevMonth(marchEnd, februaryEnd)).toBe(true);
    });

    it('keeps the same calendar day true regardless of time-of-day', () => {
      const morning = date('2024-02-28T00:01:00');
      const evening = date('2024-02-28T23:59:00');

      expect(compareDates(morning, evening)).toBe(0);
      expect(isSameDay(morning, evening)).toBe(true);
      expect(isInclusivelyAfterDay(morning, evening)).toBe(true);
      expect(isInclusivelyBeforeDay(morning, evening)).toBe(true);
    });
  });
});
