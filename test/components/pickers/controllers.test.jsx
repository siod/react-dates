import React from 'react';
import { DateTime } from 'luxon';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../helpers/index.js';
import DayPickerRangeController from '../../../src/components/DayPickerRangeController.jsx';
import DayPickerSingleDateController from '../../../src/components/DayPickerSingleDateController.jsx';
import { END_DATE, START_DATE } from '../../../src/constants.js';

afterEach(() => {
  cleanup();
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
});
