import React from 'react';
import { DateTime } from 'luxon';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../../helpers/index.js';
import DateRangePicker, { PureDateRangePicker } from '../../../../src/components/DateRangePicker.jsx';
import {
  ANCHOR_RIGHT,
  END_DATE,
  HORIZONTAL_ORIENTATION,
  OPEN_UP,
  START_DATE,
  VERTICAL_ORIENTATION,
} from '../../../../src/constants';

afterEach(cleanup);

const month = (value) => DateTime.fromISO(value);

function renderPicker(overrides = {}) {
  const props = {
    startDateId: 'start-date',
    endDateId: 'end-date',
    startDate: null,
    endDate: null,
    focusedInput: null,
    onDatesChange: vi.fn(),
    onFocusChange: vi.fn(),
    onClose: vi.fn(),
    initialVisibleMonth: () => month('2099-02-01'),
    monthFormat: (value) => value.toISODate(),
    dayAriaLabelFormat: (value) => value.toISODate(),
    isOutsideRange: () => false,
    isDayBlocked: () => false,
    numberOfMonths: 1,
    ...overrides,
  };
  return renderStrict(<DateRangePicker {...props} />);
}

function dayButton(value) {
  const candidates = Array.from(document.querySelectorAll(
    '.CalendarMonth[data-visible="true"] .CalendarDay[role="button"]',
  ));
  const result = candidates.find((element) => element.getAttribute('aria-label')?.endsWith(value));
  if (!result) throw new Error(`Unable to find visible calendar day ${value}`);
  return result;
}

describe('DateRangePicker public shell', () => {
  it('renders two accessible inputs and hides the calendar while closed', () => {
    renderPicker();

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).toBe('start-date');
    expect(inputs[1].id).toBe('end-date');
    expect(inputs[0].getAttribute('aria-label')).toBe('Start Date');
    expect(inputs[1].getAttribute('aria-label')).toBe('End Date');
    expect(document.querySelector('.DateRangePicker_picker')).toBeNull();
  });

  it('opens from the start input, reports focus, and renders the requested month', () => {
    const onFocusChange = vi.fn();
    renderPicker({ focusedInput: START_DATE, onFocusChange });

    fireEvent.focus(screen.getByRole('textbox', { name: 'Start Date' }));

    expect(onFocusChange).toHaveBeenCalledWith(START_DATE);
    expect(document.querySelector('.DateRangePicker_picker')).toBeTruthy();
    expect(screen.getByText('2099-02-01')).toBeTruthy();
  });

  it('opens the end calendar input with the end focus payload', () => {
    const onFocusChange = vi.fn();
    renderPicker({ focusedInput: END_DATE, onFocusChange });

    fireEvent.focus(screen.getByRole('textbox', { name: 'End Date' }));

    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
    expect(document.querySelector('.DateRangePicker_picker')).toBeTruthy();
  });

  it('forwards a calendar day selection and controller focus transition', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    renderPicker({
      focusedInput: START_DATE,
      onDatesChange,
      onFocusChange,
    });

    fireEvent.click(dayButton('2099-02-10'));

    const result = onDatesChange.mock.calls[0][0];
    expect(result.startDate).toBeInstanceOf(DateTime);
    expect(result.startDate.toISODate()).toBe('2099-02-10');
    expect(result.endDate).toBeNull();
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
  });

  it('closes through an outside click with the current dates', () => {
    const startDate = month('2099-02-10');
    const endDate = month('2099-02-12');
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    renderPicker({
      startDate,
      endDate,
      focusedInput: START_DATE,
      onFocusChange,
      onClose,
    });

    fireEvent.mouseDown(document.body);

    expect(onFocusChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('closes on Escape and reports the current dates', () => {
    const startDate = month('2099-02-10');
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    renderPicker({ startDate, focusedInput: START_DATE, onFocusChange, onClose });

    fireEvent.keyDown(screen.getByRole('application', { name: 'Calendar' }), { key: 'Escape' });

    expect(onFocusChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledWith({ startDate, endDate: null });
  });

  it('clears both dates and can request the picker to reopen', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    renderPicker({
      startDate: month('2099-02-10'),
      endDate: month('2099-02-12'),
      showClearDates: true,
      reopenPickerOnClearDates: true,
      onDatesChange,
      onFocusChange,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear Dates' }));

    expect(onDatesChange).toHaveBeenCalledWith({ startDate: null, endDate: null });
    expect(onFocusChange).toHaveBeenCalledWith(START_DATE);
  });

  it('forwards disabled state to the corresponding inputs', () => {
    renderPicker({ disabled: END_DATE });

    const [start, end] = screen.getAllByRole('textbox');
    expect(start.disabled).toBe(false);
    expect(end.disabled).toBe(true);
  });

  it('forwards read-only and required accessibility state', () => {
    renderPicker({ readOnly: true, required: true });

    const [start, end] = screen.getAllByRole('textbox');
    expect(start.readOnly).toBe(true);
    expect(end.readOnly).toBe(true);
    expect(start.required).toBe(true);
    expect(end.required).toBe(true);
  });

  it('uses initialVisibleMonth ahead of the selected dates', () => {
    renderPicker({
      startDate: month('2099-05-10'),
      initialVisibleMonth: () => month('2099-02-01'),
      focusedInput: START_DATE,
    });

    expect(screen.getByText('2099-02-01')).toBeTruthy();
    expect(screen.queryByText('2099-05-01')).toBeNull();
  });

  it('uses the selected end month when no initial month is supplied', () => {
    renderPicker({
      endDate: month('2099-05-10'),
      initialVisibleMonth: undefined,
      focusedInput: END_DATE,
    });

    expect(screen.getByText('2099-05-01')).toBeTruthy();
  });

  it('renders multiple months and preserves vertical RTL presentation', () => {
    const { container } = renderPicker({
      focusedInput: START_DATE,
      numberOfMonths: 2,
      orientation: VERTICAL_ORIENTATION,
      isRTL: true,
    });

    expect(container.querySelector('.DayPicker:not(.DayPicker__horizontal)')).toBeTruthy();
    expect(container.querySelector('[dir="rtl"]')).toBeTruthy();
    expect(container.querySelectorAll('.CalendarMonth[data-visible="true"]')).toHaveLength(2);
  });

  it('renders horizontal orientation by default with accessible day labels', () => {
    renderPicker({
      focusedInput: START_DATE,
      orientation: HORIZONTAL_ORIENTATION,
    });

    expect(document.querySelector('.DayPicker__horizontal')).toBeTruthy();
    expect(dayButton('2099-02-10').getAttribute('aria-label')).toContain('2099-02-10');
  });

  it('applies responsive open and anchor directions to the rendered picker', () => {
    renderPicker({
      focusedInput: START_DATE,
      openDirection: OPEN_UP,
      anchorDirection: ANCHOR_RIGHT,
    });

    const picker = document.querySelector('.DateRangePicker_picker');
    expect(picker.style.bottom).not.toBe('');
    expect(picker.style.right).not.toBe('');
  });

  it('forwards min and max dates to month navigation boundaries', () => {
    renderPicker({
      focusedInput: START_DATE,
      minDate: month('2099-02-01'),
      maxDate: month('2099-02-01'),
    });

    expect(screen.getByRole('button', { name: 'Move backward to switch to the previous month.' })
      .getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Move forward to switch to the next month.' })
      .getAttribute('aria-disabled')).toBe('true');
  });

  it('forwards offsets to the range controller when a date is selected', () => {
    const onDatesChange = vi.fn();
    renderPicker({
      focusedInput: START_DATE,
      onDatesChange,
      startDateOffset: (day) => day.minus({ days: 2 }),
      endDateOffset: (day) => day.plus({ days: 4 }),
    });

    fireEvent.click(dayButton('2099-02-10'));

    const result = onDatesChange.mock.calls[0][0];
    expect(result.startDate.toISODate()).toBe('2099-02-08');
    expect(result.endDate.toISODate()).toBe('2099-02-14');
  });

  it('locks scroll for a portal and restores it on unmount', () => {
    const scrollRoot = document.scrollingElement || document.documentElement;
    const { unmount } = renderPicker({
      focusedInput: START_DATE,
      withPortal: true,
      disableScroll: true,
    });

    expect(document.body.querySelector('.DateRangePicker_picker')).toBeTruthy();
    expect(scrollRoot.style.overflow).toBe('hidden');

    unmount();

    expect(scrollRoot.style.overflow).toBe('');
  });

  it('renders a full-screen portal close control with a custom icon', () => {
    renderPicker({
      focusedInput: START_DATE,
      withFullScreenPortal: true,
      customCloseIcon: <span data-testid="range-close-icon">close</span>,
    });

    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toBeTruthy();
    expect(screen.getByTestId('range-close-icon')).toBeTruthy();
  });

  it('renders a custom calendar icon and opens through its callback', () => {
    const onFocusChange = vi.fn();
    renderPicker({
      onFocusChange,
      customInputIcon: <span data-testid="range-calendar-icon">calendar</span>,
      showDefaultInputIcon: true,
    });

    expect(screen.getByTestId('range-calendar-icon')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {
      name: 'Interact with the calendar and add the check-in date for your trip.',
    }));
    expect(onFocusChange).toHaveBeenCalledWith(START_DATE);
  });
});
