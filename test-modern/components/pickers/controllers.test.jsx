import React from 'react';
import { DateTime, Settings } from 'luxon';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../helpers/index.js';
import DayPickerRangeController from '../../../src/components/DayPickerRangeController.jsx';
import DayPickerSingleDateController from '../../../src/components/DayPickerSingleDateController.jsx';
import DateRangePickerInputController from '../../../src/components/DateRangePickerInputController.jsx';
import SingleDatePickerInputController from '../../../src/components/SingleDatePickerInputController.jsx';
import { END_DATE, START_DATE } from '../../../src/constants.js';

afterEach(() => {
  Settings.defaultLocale = null;
  cleanup();
});

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

  it('passes localized DateTimes directly to formatter callbacks', () => {
    const calls = [];
    const props = singleProps({
      date: DateTime.fromISO('2099-02-03').setLocale('en-GB'),
      displayFormat: (dateValue) => {
        calls.push(dateValue);
        return `formatted:${dateValue.toISODate()}`;
      },
    });

    renderStrict(<SingleDatePickerInputController {...props} />);

    expect(screen.getByRole('textbox').value).toBe('formatted:2099-02-03');
    expect(calls[0]).toBe(props.date);
    expect(calls[0].locale).toBe('en-GB');
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
  it('recomputes visible single-picker modifiers when blocking props change', () => {
    const initialVisibleMonth = () => DateTime.fromISO('2099-02-01');
    const { container, rerender } = renderStrict(
      <DayPickerSingleDateController
        focused
        isFocused
        initialVisibleMonth={initialVisibleMonth}
        isOutsideRange={() => false}
        isDayBlocked={() => false}
      />,
    );
    const findDay = () => Array.from(container.querySelectorAll(
      '.CalendarMonth[data-visible="true"] .CalendarDay',
    )).find((element) => element.textContent === '10');

    expect(findDay().getAttribute('aria-disabled')).toBe('false');

    rerender(
      <DayPickerSingleDateController
        focused
        isFocused
        initialVisibleMonth={initialVisibleMonth}
        isOutsideRange={() => false}
        isDayBlocked={(day) => day.day === 10}
      />,
    );

    expect(findDay().getAttribute('aria-disabled')).toBe('true');
    expect(findDay().className).toContain('CalendarDay__blocked_calendar');
  });

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

  it('passes DateTimes with their locale to calendar formatter callbacks', () => {
    const monthFormat = vi.fn((dateValue) => `month:${dateValue.toISODate()}`);
    const weekDayFormat = vi.fn((dateValue) => `weekday:${dateValue.toISODate()}`);
    const dayAriaLabelFormat = vi.fn((dateValue) => `day:${dateValue.toISODate()}`);
    renderStrict(
      <DayPickerSingleDateController
        focused
        isFocused
        initialVisibleMonth={() => DateTime.fromISO('2099-02-01').setLocale('en-AU')}
        isOutsideRange={() => false}
        monthFormat={monthFormat}
        weekDayFormat={weekDayFormat}
        dayAriaLabelFormat={dayAriaLabelFormat}
      />,
    );

    expect(screen.getByText('month:2099-02-01')).toBeTruthy();
    expect(screen.getByText('weekday:2021-08-01')).toBeTruthy();
    expect(monthFormat).toHaveBeenCalledWith(expect.any(DateTime));
    expect(monthFormat.mock.calls[0][0].locale).toBe('en-AU');
    expect(dayAriaLabelFormat).toHaveBeenCalledWith(expect.any(DateTime));
    expect(dayAriaLabelFormat.mock.calls[0][0].locale).toBe('en-AU');
  });

  it('updates range hover state without recomputing every visible day', () => {
    const isDayHighlighted = vi.fn(() => false);
    const controllerRef = React.createRef();
    const { container } = renderStrict(
      <DayPickerRangeController
        ref={controllerRef}
        startDate={DateTime.fromISO('2099-02-10').setLocale('en-AU')}
        endDate={null}
        focusedInput={END_DATE}
        isFocused
        onDatesChange={() => {}}
        onFocusChange={() => {}}
        initialVisibleMonth={() => DateTime.fromISO('2099-02-01').setLocale('en-AU')}
        isOutsideRange={() => false}
        isDayHighlighted={isDayHighlighted}
      />,
    );
    controllerRef.current.isTouchDevice = false;
    const findDay = (dayOfMonth) => Array.from(container.querySelectorAll(
      '.CalendarMonth[data-visible="true"] .CalendarDay',
    )).find((element) => element.textContent === String(dayOfMonth));
    const callsAfterInitialRender = isDayHighlighted.mock.calls.length;

    fireEvent.mouseEnter(findDay(15));
    fireEvent.mouseLeave(findDay(15), { relatedTarget: findDay(16) });
    fireEvent.mouseEnter(findDay(16), { relatedTarget: findDay(15) });

    expect(isDayHighlighted).toHaveBeenCalledTimes(callsAfterInitialRender);
    expect(findDay(11).className).toContain('CalendarDay__hovered_span');
    expect(findDay(16).className).toContain('CalendarDay__hovered_span');
  });

  it('highlights the prospective range while hovering over an end date', () => {
    const controllerRef = React.createRef();
    const { container } = renderStrict(
      <DayPickerRangeController
        ref={controllerRef}
        startDate={DateTime.fromISO('2099-02-10')}
        endDate={null}
        focusedInput={END_DATE}
        isFocused
        onDatesChange={() => {}}
        onFocusChange={() => {}}
        initialVisibleMonth={() => DateTime.fromISO('2099-02-01')}
        isOutsideRange={() => false}
      />,
    );
    controllerRef.current.isTouchDevice = false;
    const findDay = (dayOfMonth) => Array.from(container.querySelectorAll(
      '.CalendarMonth[data-visible="true"] .CalendarDay',
    )).find((element) => element.textContent === String(dayOfMonth));

    fireEvent.mouseEnter(findDay(15));

    expect(findDay(9).className).not.toContain('CalendarDay__hovered_span');
    expect(findDay(11).className).toContain('CalendarDay__hovered_span');
    expect(findDay(15).className).toContain('CalendarDay__hovered_span');

    fireEvent.mouseLeave(findDay(15));
    expect(findDay(11).className).not.toContain('CalendarDay__hovered_span');
  });

  it('uses Luxon Settings.defaultLocale when no date exists yet', () => {
    Settings.defaultLocale = 'en-GB';
    const props = singleProps({ isOutsideRange: () => false });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '03/02/2024' } });

    expect(props.onDateChange.mock.calls[0][0].toISODate()).toBe('2024-02-03');
    expect(props.onDateChange.mock.calls[0][0].locale).toBe('en-GB');
  });
});
