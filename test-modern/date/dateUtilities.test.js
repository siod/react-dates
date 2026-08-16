import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import isDayVisible from '../../src/utils/isDayVisible';
import isNextDay from '../../src/utils/isNextDay';
import isNextMonth from '../../src/utils/isNextMonth';
import isPreviousDay from '../../src/utils/isPreviousDay';
import isPrevMonth from '../../src/utils/isPrevMonth';
import isSameMonth from '../../src/utils/isSameMonth';
import toISODateString from '../../src/utils/toISODateString';
import toISOMonthString from '../../src/utils/toISOMonthString';

const date = (value) => DateTime.fromISO(value);

describe('DateTime-native date utilities', () => {
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
});
