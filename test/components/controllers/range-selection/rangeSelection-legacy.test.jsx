import React from 'react';
import { DateTime } from 'luxon';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../../helpers/index.js';
import DayPickerRangeController from '../../../../src/components/DayPickerRangeController.jsx';
import { END_DATE, START_DATE } from '../../../../src/constants';

afterEach(cleanup);

const month = (value) => DateTime.fromISO(value);

function renderRange(overrides = {}) {
  const props = {
    focusedInput: START_DATE,
    isFocused: true,
    initialVisibleMonth: () => month('2099-02-01'),
    isOutsideRange: () => false,
    isDayBlocked: () => false,
    dayAriaLabelFormat: (day) => day.toISODate(),
    numberOfMonths: 1,
    ...overrides,
  };
  return renderStrict(<DayPickerRangeController {...props} />);
}

function dayButton(value) {
  const candidates = Array.from(document.querySelectorAll(
    '.CalendarMonth[data-visible="true"] .CalendarDay[role="button"]',
  ));
  const result = candidates.find((element) => element.getAttribute('aria-label')?.endsWith(value));
  if (!result) throw new Error(`Unable to find visible calendar day ${value}`);
  return result;
}

function clickDay(value) {
  fireEvent.click(dayButton(value));
}

describe('DayPickerRangeController range selection', () => {
  it('selects a start date, advances logical focus, and keeps calendar focus active', () => {
    const events = [];
    const onDatesChange = vi.fn((value) => events.push(['dates', value]));
    const onFocusChange = vi.fn((value) => events.push(['focus', value]));
    const onBlur = vi.fn(() => events.push(['blur']));
    renderRange({ onDatesChange, onFocusChange, onBlur });

    clickDay('2099-02-10');

    const result = onDatesChange.mock.calls[0][0];
    expect(result.startDate).toBeInstanceOf(DateTime);
    expect(result.startDate.toISODate()).toBe('2099-02-10');
    expect(result.endDate).toBeNull();
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
    expect(onBlur).not.toHaveBeenCalled();
    expect(events.map(([type]) => type)).toEqual(['dates', 'focus']);
  });

  it('selects a valid end date, closes, and preserves callback ordering and payloads', () => {
    const startDate = month('2099-02-10');
    const events = [];
    const onDatesChange = vi.fn((value) => events.push(['dates', value]));
    const onFocusChange = vi.fn((value) => events.push(['focus', value]));
    const onClose = vi.fn((value) => events.push(['close', value]));
    renderRange({
      startDate,
      focusedInput: END_DATE,
      onDatesChange,
      onFocusChange,
      onClose,
    });

    clickDay('2099-02-12');

    const result = onDatesChange.mock.calls[0][0];
    expect(result).toEqual({ startDate, endDate: expect.any(DateTime) });
    expect(result.endDate.toISODate()).toBe('2099-02-12');
    expect(onFocusChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledWith(result);
    expect(events.map(([type]) => type)).toEqual(['dates', 'focus', 'close']);
  });

  it('allows a same-day range when minimumNights is zero', () => {
    const date = month('2099-02-10');
    const onDatesChange = vi.fn();
    renderRange({
      startDate: date,
      focusedInput: END_DATE,
      minimumNights: 0,
      onDatesChange,
    });

    clickDay('2099-02-10');

    expect(onDatesChange).toHaveBeenCalledWith({
      startDate: date,
      endDate: expect.any(DateTime),
    });
  });

  it('does not select a blocked day or move focus', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    renderRange({
      isDayBlocked: (day) => day.toISODate() === '2099-02-10',
      onDatesChange,
      onFocusChange,
    });

    expect(dayButton('2099-02-10').getAttribute('aria-disabled')).toBe('true');
    clickDay('2099-02-10');

    expect(onDatesChange).not.toHaveBeenCalled();
    expect(onFocusChange).not.toHaveBeenCalled();
  });

  it('does not select an end date before the minimum-night boundary', () => {
    const onDatesChange = vi.fn();
    const startDate = month('2099-02-10');
    renderRange({
      startDate,
      focusedInput: END_DATE,
      minimumNights: 2,
      onDatesChange,
    });

    expect(dayButton('2099-02-11').getAttribute('aria-disabled')).toBe('true');
    clickDay('2099-02-11');

    expect(onDatesChange).not.toHaveBeenCalled();
  });

  it('permits a minimum-night-violating end click without moving focus when opted in', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    const startDate = month('2099-02-10');
    renderRange({
      startDate,
      focusedInput: END_DATE,
      minimumNights: 3,
      daysViolatingMinNightsCanBeClicked: true,
      onDatesChange,
      onFocusChange,
      onClose,
    });

    clickDay('2099-02-11');

    expect(onDatesChange).toHaveBeenCalledWith({
      startDate,
      endDate: expect.any(DateTime),
    });
    expect(onDatesChange.mock.calls[0][0].endDate.toISODate()).toBe('2099-02-11');
    expect(onFocusChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses an earlier clicked start date and retains an existing valid end date', () => {
    const endDate = month('2099-02-20');
    const onDatesChange = vi.fn();
    renderRange({ endDate, onDatesChange });

    clickDay('2099-02-10');

    expect(onDatesChange).toHaveBeenCalledWith({
      startDate: expect.any(DateTime),
      endDate,
    });
    expect(onDatesChange.mock.calls[0][0].startDate.toISODate()).toBe('2099-02-10');
  });

  it('selects an end date when focusedInput is END_DATE and no start exists', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    renderRange({
      startDate: null,
      focusedInput: END_DATE,
      onDatesChange,
      onFocusChange,
    });

    clickDay('2099-02-10');

    expect(onDatesChange).toHaveBeenCalledWith({
      startDate: null,
      endDate: expect.any(DateTime),
    });
    expect(onDatesChange.mock.calls[0][0].endDate.toISODate()).toBe('2099-02-10');
    expect(onFocusChange).toHaveBeenCalledWith(START_DATE);
  });

  it('keeps the range open after a valid end selection when requested', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    renderRange({
      startDate: month('2099-02-10'),
      focusedInput: END_DATE,
      keepOpenOnDateSelect: true,
      onDatesChange,
      onFocusChange,
      onClose,
    });

    clickDay('2099-02-12');

    expect(onDatesChange).toHaveBeenCalledTimes(1);
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes instead of advancing focus when the end input is disabled', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    renderRange({
      disabled: END_DATE,
      onDatesChange,
      onFocusChange,
      onClose,
    });

    clickDay('2099-02-10');

    const result = onDatesChange.mock.calls[0][0];
    expect(result.startDate.toISODate()).toBe('2099-02-10');
    expect(result.endDate).toBeNull();
    expect(onFocusChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledWith(result);
  });

  it('does not replace the start date when an invalid end is clicked with start disabled', () => {
    const startDate = month('2099-02-11');
    const onDatesChange = vi.fn();
    renderRange({
      startDate,
      focusedInput: END_DATE,
      disabled: START_DATE,
      minimumNights: 2,
      onDatesChange,
    });

    clickDay('2099-02-10');

    expect(onDatesChange).toHaveBeenCalledWith({ startDate, endDate: null });
  });

  it('derives both selected endpoints from a clicked date using offsets', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    renderRange({
      startDateOffset: (day) => day.minus({ days: 2 }),
      endDateOffset: (day) => day.plus({ days: 4 }),
      onDatesChange,
      onFocusChange,
      onClose,
    });

    clickDay('2099-02-10');

    expect(onDatesChange).toHaveBeenCalledWith({
      startDate: expect.any(DateTime),
      endDate: expect.any(DateTime),
    });
    const result = onDatesChange.mock.calls[0][0];
    expect(result.startDate.toISODate()).toBe('2099-02-08');
    expect(result.endDate.toISODate()).toBe('2099-02-14');
    expect(onFocusChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledWith(result);
  });

  it('uses the clicked date for an unspecified offset endpoint', () => {
    const onDatesChange = vi.fn();
    const startDateOffset = (day) => day.minus({ days: 2 });
    renderRange({ startDateOffset, onDatesChange });

    clickDay('2099-02-10');

    const result = onDatesChange.mock.calls[0][0];
    expect(result.startDate.toISODate()).toBe('2099-02-08');
    expect(result.endDate.toISODate()).toBe('2099-02-10');
  });

  it('rejects a click when a derived offset endpoint is blocked', () => {
    const onDatesChange = vi.fn();
    renderRange({
      startDateOffset: (day) => day.minus({ days: 2 }),
      endDateOffset: (day) => day.plus({ days: 4 }),
      isDayBlocked: (day) => day.toISODate() === '2099-02-14',
      onDatesChange,
    });

    clickDay('2099-02-10');

    expect(onDatesChange).not.toHaveBeenCalled();
  });

  it('rejects a click when a derived offset endpoint is outside range', () => {
    const onDatesChange = vi.fn();
    renderRange({
      endDateOffset: (day) => day.plus({ days: 4 }),
      isOutsideRange: (day) => day.toISODate() === '2099-02-14',
      onDatesChange,
    });

    clickDay('2099-02-10');

    expect(onDatesChange).not.toHaveBeenCalled();
  });

  it('closes the calendar through Escape and reports blur', () => {
    const onBlur = vi.fn();
    renderRange({ onBlur });
    const calendar = screen.getByRole('application', { name: 'Calendar' });

    fireEvent.keyDown(calendar, { key: 'Escape' });

    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

describe('DayPickerRangeController month and prop updates', () => {
  it('honors initialVisibleMonth and keeps the rendered month deterministic', () => {
    renderRange({
      monthFormat: (value) => value.toISODate(),
      initialVisibleMonth: () => month('2099-07-01'),
    });

    expect(screen.getByText('2099-07-01')).toBeTruthy();
  });

  it('moves to a newly supplied start-date month when the visible month is uncontrolled', () => {
    const { rerender } = renderRange({
      monthFormat: (value) => value.toISODate(),
      initialVisibleMonth: undefined,
      startDate: null,
    });
    const initialMonths = Array.from(document.querySelectorAll('.CalendarMonth_caption strong'));
    expect(initialMonths.some((element) => element.textContent.startsWith(`${DateTime.local().year}-`))).toBe(true);

    rerender(
      <DayPickerRangeController
        focusedInput={START_DATE}
        isFocused
        startDate={month('2099-11-10')}
        monthFormat={(value) => value.toISODate()}
        isOutsideRange={() => false}
        dayAriaLabelFormat={(day) => day.toISODate()}
        numberOfMonths={1}
      />,
    );

    const visibleMonths = Array.from(document.querySelectorAll(
      '.CalendarMonth[data-visible="true"] .CalendarMonth_caption strong',
    ));
    expect(visibleMonths.some((element) => element.textContent === '2099-11-01')).toBe(true);
  });

  it('updates selected and blocked day rendering when relevant props change', () => {
    const initialVisibleMonth = () => month('2099-02-01');
    const { rerender } = renderRange({ initialVisibleMonth });

    rerender(
      <DayPickerRangeController
        focusedInput={START_DATE}
        isFocused
        startDate={month('2099-02-10')}
        initialVisibleMonth={initialVisibleMonth}
        isOutsideRange={() => false}
        isDayBlocked={(day) => day.toISODate() === '2099-02-12'}
        dayAriaLabelFormat={(day) => day.toISODate()}
        numberOfMonths={1}
      />,
    );

    expect(dayButton('2099-02-10').className).toContain('CalendarDay__selected_start');
    expect(dayButton('2099-02-12').getAttribute('aria-disabled')).toBe('true');
    expect(dayButton('2099-02-12').className).toContain('CalendarDay__blocked_calendar');
  });
});
