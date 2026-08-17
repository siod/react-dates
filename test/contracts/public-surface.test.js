import { describe, expect, it } from 'vitest';

import * as constants from '../../src/constants';
import DateRangePickerShape from '../../src/shapes/DateRangePickerShape';
import SingleDatePickerShape from '../../src/shapes/SingleDatePickerShape';

describe('v22 public surface', () => {
  it('keeps locale, calendar, and numbering-system overrides out of picker props', () => {
    [DateRangePickerShape, SingleDatePickerShape].forEach((shape) => {
      expect(shape).not.toHaveProperty('locale');
      expect(shape).not.toHaveProperty('calendar');
      expect(shape).not.toHaveProperty('numberingSystem');
    });
  });

  it('uses frozen Intl formatting options instead of date-library tokens', () => {
    expect(constants.DEFAULT_INPUT_FORMAT).toEqual({ dateStyle: 'short' });
    expect(constants.DEFAULT_MONTH_FORMAT).toEqual({ month: 'long', year: 'numeric' });
    expect(constants.DEFAULT_WEEKDAY_FORMAT).toEqual({ weekday: 'short' });
    expect(constants.DEFAULT_DAY_ARIA_FORMAT).toEqual({ dateStyle: 'full' });

    expect(Object.isFrozen(constants.DEFAULT_INPUT_FORMAT)).toBe(true);
    expect(constants).not.toHaveProperty('DISPLAY_FORMAT');
    expect(constants).not.toHaveProperty('ISO_FORMAT');
    expect(constants).not.toHaveProperty('ISO_MONTH_FORMAT');
  });
});
