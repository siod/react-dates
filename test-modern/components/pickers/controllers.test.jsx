import React from 'react';
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
  it('accepts canonical input and emits only ISO strings', () => {
    const props = singleProps({
      isOutsideRange: () => false,
      date: null,
    });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2024-02-03' } });

    expect(props.onDateChange).toHaveBeenCalledWith('2024-02-03');
    expect(props.onDateChange.mock.calls[0][0]).not.toBeInstanceOf(Date);
    expect(props.onClose).toHaveBeenCalledWith({ date: '2024-02-03' });
  });

  it('returns null for malformed or impossible input without throwing', () => {
    const props = singleProps({ keepOpenOnDateSelect: true, isOutsideRange: () => false });
    renderStrict(<SingleDatePickerInputController {...props} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '2024-02-30' } });

    expect(props.onDateChange).toHaveBeenCalledWith(null);
  });

  it('passes ISO values and locale context to formatter callbacks', () => {
    const calls = [];
    const props = singleProps({
      date: '2099-02-03',
      locale: 'en-GB',
      displayFormat: (isoDate, context) => {
        calls.push({ isoDate, context });
        return `formatted:${isoDate}`;
      },
    });

    renderStrict(<SingleDatePickerInputController {...props} />);

    expect(screen.getByRole('textbox').value).toBe('formatted:2099-02-03');
    expect(calls[0]).toEqual({
      isoDate: '2099-02-03',
      context: { locale: 'en-GB', numberingSystem: undefined },
    });
  });

  it('validates range ordering and minimum nights with canonical dates', () => {
    const props = {
      startDate: '2099-02-10',
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
      startDate: '2099-02-10',
      endDate: null,
    });
  });

  it('clears dates with null values', () => {
    const props = {
      ...singleProps({ date: '2099-02-03' }),
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
        initialVisibleMonth={() => '2099-02-01'}
        isOutsideRange={() => false}
      />,
    );

    const day = screen.getAllByRole('button').find((element) => element.tagName === 'TD');
    fireEvent.click(day);

    expect(onDatesChange).toHaveBeenCalledWith({ startDate: expect.any(String), endDate: null });
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
  });

  it('preserves formatter callbacks and their library-neutral context', () => {
    const monthFormat = vi.fn((date) => `month:${date}`);
    const weekDayFormat = vi.fn((date) => `weekday:${date}`);
    const dayAriaLabelFormat = vi.fn((date) => `day:${date}`);
    renderStrict(
      <DayPickerSingleDateController
        focused
        isFocused
        initialVisibleMonth={() => '2099-02-01'}
        isOutsideRange={() => false}
        monthFormat={monthFormat}
        weekDayFormat={weekDayFormat}
        dayAriaLabelFormat={dayAriaLabelFormat}
        locale="en-AU"
      />,
    );

    expect(screen.getByText('month:2099-02-01')).toBeTruthy();
    expect(screen.getByText('weekday:2021-08-01')).toBeTruthy();
    expect(monthFormat).toHaveBeenCalledWith('2099-02-01', {
      locale: 'en-AU', numberingSystem: undefined,
    });
    expect(dayAriaLabelFormat).toHaveBeenCalledWith(expect.any(String), {
      locale: 'en-AU', numberingSystem: undefined,
    });
  });
});
