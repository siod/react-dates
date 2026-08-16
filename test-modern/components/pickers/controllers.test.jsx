import React from 'react';
import { DateTime } from 'luxon';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../helpers/index.js';
import DayPickerRangeController from '../../../src/components/DayPickerRangeController.jsx';
import DayPickerSingleDateController from '../../../src/components/DayPickerSingleDateController.jsx';
import DateRangePickerInputController from '../../../src/components/DateRangePickerInputController.jsx';
import SingleDatePickerInputController from '../../../src/components/SingleDatePickerInputController.jsx';
import { END_DATE, START_DATE } from '../../../src/constants.js';

afterEach(cleanup);

function singleProps(overrides = {}) {
  return {
    id: 'date',
    onDateChange: vi.fn(),
    onFocusChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe('picker input controllers', () => {
  it('accepts localized input and emits Luxon DateTimes', () => {
    const props = singleProps({
      isOutsideRange: () => false,
      date: null,
    });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2024-02-03' } });

    const emitted = props.onDateChange.mock.calls[0][0];
    expect(emitted).toBeInstanceOf(DateTime);
    expect(emitted.toISODate()).toBe('2024-02-03');
    expect(props.onClose.mock.calls[0][0].date).toBe(emitted);
  });

  it('returns null for malformed or impossible input without throwing', () => {
    const props = singleProps({ keepOpenOnDateSelect: true, isOutsideRange: () => false });
    renderStrict(<SingleDatePickerInputController {...props} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '2024-02-30' } });

    expect(props.onDateChange).toHaveBeenCalledWith(null);
  });

  it('passes DateTimes and locale context to formatter callbacks', () => {
    const calls = [];
    const props = singleProps({
      date: DateTime.fromISO('2099-02-03'),
      locale: 'en-GB',
      displayFormat: (dateValue, context) => {
        calls.push({ dateValue, context });
        return `formatted:${dateValue.toISODate()}`;
      },
    });

    renderStrict(<SingleDatePickerInputController {...props} />);

    expect(screen.getByRole('textbox').value).toBe('formatted:2099-02-03');
    expect(calls[0]).toEqual({
      dateValue: expect.any(DateTime),
      context: { locale: 'en-GB' },
    });
  });

  it('validates range ordering and minimum nights with DateTimes', () => {
    const startDate = DateTime.fromISO('2099-02-10');
    const props = {
      startDate,
      endDate: null,
      onDatesChange: vi.fn(),
      onFocusChange: vi.fn(),
      onClose: vi.fn(),
      minimumNights: 2,
      isOutsideRange: () => false,
      isDayBlocked: () => false,
    };
    renderStrict(<DateRangePickerInputController {...props} />);
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '2099-02-11' } });

    expect(props.onDatesChange).toHaveBeenCalledWith({
      startDate,
      endDate: null,
    });
  });

  it('clears dates with null values', () => {
    const props = {
      ...singleProps({ date: DateTime.fromISO('2099-02-03') }),
      showClearDate: true,
    };
    renderStrict(<SingleDatePickerInputController {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /clear date/i }));
    expect(props.onDateChange).toHaveBeenCalledWith(null);
  });
});

describe('day picker controllers', () => {
  it('emits the established scalar focus value when a range start is selected', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    renderStrict(
      <DayPickerRangeController
        startDate={null}
        endDate={null}
        focusedInput={START_DATE}
        isFocused
        onDatesChange={onDatesChange}
        onFocusChange={onFocusChange}
        initialVisibleMonth={() => DateTime.fromISO('2099-02-01')}
        isOutsideRange={() => false}
      />,
    );

    const day = screen.getAllByRole('button').find((element) => element.tagName === 'TD');
    fireEvent.click(day);

    expect(onDatesChange).toHaveBeenCalledWith({ startDate: expect.any(DateTime), endDate: null });
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
  });

  it('passes DateTimes to formatter callbacks with locale context', () => {
    const monthFormat = vi.fn((dateValue) => `month:${dateValue.toISODate()}`);
    const weekDayFormat = vi.fn((dateValue) => `weekday:${dateValue.toISODate()}`);
    const dayAriaLabelFormat = vi.fn((dateValue) => `day:${dateValue.toISODate()}`);
    renderStrict(
      <DayPickerSingleDateController
        focused
        isFocused
        initialVisibleMonth={() => DateTime.fromISO('2099-02-01')}
        isOutsideRange={() => false}
        monthFormat={monthFormat}
        weekDayFormat={weekDayFormat}
        dayAriaLabelFormat={dayAriaLabelFormat}
        locale="en-AU"
      />,
    );

    expect(screen.getByText('month:2099-02-01')).toBeTruthy();
    expect(screen.getByText('weekday:2021-08-01')).toBeTruthy();
    expect(monthFormat).toHaveBeenCalledWith(expect.any(DateTime), {
      locale: 'en-AU',
    });
    expect(dayAriaLabelFormat).toHaveBeenCalledWith(expect.any(DateTime), {
      locale: 'en-AU',
    });
  });
});
