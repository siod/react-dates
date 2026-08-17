import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import toISODateString from '../../src/utils/toISODateString';
import toISOMonthString from '../../src/utils/toISOMonthString';
import toLocalizedDateString from '../../src/utils/toLocalizedDateString';

const date = (value, locale) => {
  const result = DateTime.fromISO(value);
  return locale ? result.setLocale(locale) : result;
};

describe('date serialization utilities', () => {
  describe('toISODateString', () => {
    it('serializes a valid Luxon DateTime', () => {
      expect(toISODateString(date('1991-07-13'))).toBe('1991-07-13');
    });

    it('returns null for nullish, string, and invalid date values', () => {
      expect(toISODateString()).toBeNull();
      expect(toISODateString(null)).toBeNull();
      expect(toISODateString('1991-07-13')).toBeNull();
      expect(toISODateString(DateTime.invalid('invalid'))).toBeNull();
    });
  });

  describe('toISOMonthString', () => {
    it('serializes the month from a valid Luxon DateTime', () => {
      expect(toISOMonthString(date('1991-07-13'))).toBe('1991-07');
    });

    it('returns null for strings and invalid date values', () => {
      expect(toISOMonthString('1991-07-13')).toBeNull();
      expect(toISOMonthString(DateTime.invalid('invalid'))).toBeNull();
    });
  });

  describe('toLocalizedDateString', () => {
    it('formats a DateTime with its locale and requested options', () => {
      const value = date('1991-07-13', 'en-GB');

      expect(toLocalizedDateString(value, { dateStyle: 'short' })).toBe(
        value.toLocaleString({ dateStyle: 'short' }),
      );
    });

    it('returns null for nullish, string, and invalid date values', () => {
      expect(toLocalizedDateString()).toBeNull();
      expect(toLocalizedDateString(null)).toBeNull();
      expect(toLocalizedDateString('1991-07-13')).toBeNull();
      expect(toLocalizedDateString(DateTime.invalid('invalid'))).toBeNull();
    });
  });
});
