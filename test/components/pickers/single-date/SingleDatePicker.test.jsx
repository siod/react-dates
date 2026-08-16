import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SingleDatePicker from '../../../../src/components/SingleDatePicker.jsx';
import {
  ANCHOR_RIGHT, OPEN_UP, VERTICAL_ORIENTATION,
} from '../../../../src/constants.js';
import { renderStrict } from '../../../helpers/index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const initialMonth = DateTime.fromISO('2099-02-01', { zone: 'UTC' }).setLocale('en-US');
const selectedDate = DateTime.fromISO('2099-02-14', { zone: 'UTC' }).setLocale('en-US');

function pickerProps(overrides = {}) {
  return {
    id: 'single-date',
    date: null,
    focused: false,
    onDateChange: vi.fn(),
    onFocusChange: vi.fn(),
    onClose: vi.fn(),
    initialVisibleMonth: () => initialMonth,
    isOutsideRange: () => false,
    isDayBlocked: () => false,
    dayAriaLabelFormat: (day) => day.toISODate(),
    displayFormat: (date) => date.toISODate(),
    transitionDuration: 0,
    numberOfMonths: 1,
    ...overrides,
  };
}

function renderPicker(overrides = {}) {
  return renderStrict(<SingleDatePicker {...pickerProps(overrides)} />);
}

function pickerRoot(container = document) {
  return container.querySelector('.SingleDatePicker_picker');
}

function visibleMonth(container, month = initialMonth) {
  return container.querySelector(
    `.CalendarMonth[data-visible="true"]`,
  ) || Array.from(container.querySelectorAll('.CalendarMonth'))
    .find((element) => element.textContent.includes(`${month.monthLong} ${month.year}`));
}

function dayButton(container, isoDate) {
  const exact = container.querySelector(`.CalendarMonth[data-visible="true"] [aria-label="${isoDate}"]`);
  if (exact) return exact;
  const dayOfMonth = String(Number(isoDate.slice(-2)));
  return Array.from(container.querySelectorAll('.CalendarMonth[data-visible="true"] .CalendarDay'))
    .find((day) => day.textContent === dayOfMonth);
}

describe('SingleDatePicker observable behavior', () => {
  it('renders an accessible input with a formatted Luxon date', () => {
    const { container } = renderPicker({
      ariaLabel: 'Trip date',
      date: selectedDate,
      placeholder: 'Choose a date',
      required: true,
      screenReaderInputMessage: 'Use the calendar to choose a trip date',
      titleText: 'Trip date picker',
    });
    const input = screen.getByRole('textbox', { name: 'Trip date' });

    expect(input.value).toBe('2099-02-14');
    expect(input.getAttribute('placeholder')).toBe('Choose a date');
    expect(input.getAttribute('title')).toBe('Trip date picker');
    expect(input.getAttribute('aria-describedby')).toContain('single-date');
    expect(input.required).toBe(true);
    expect(container.querySelector('.SingleDatePickerInput')).toBeTruthy();
  });

  it('renders the calendar only when focused and honors initial month precedence', () => {
    const { container, rerender } = renderPicker({
      date: DateTime.fromISO('2099-04-10', { zone: 'UTC' }),
    });
    expect(pickerRoot(container)).toBeNull();

    rerender(
      <SingleDatePicker
        {...pickerProps({
          date: DateTime.fromISO('2099-04-10', { zone: 'UTC' }),
          focused: true,
        })}
      />,
    );
    expect(pickerRoot(container)).toBeTruthy();
    expect(visibleMonth(container).textContent).toContain('February 2099');
    expect(visibleMonth(container).textContent).not.toContain('April 2099');
  });

  it('opens from input focus and does not focus when disabled', () => {
    const onFocusChange = vi.fn();
    const { rerender } = renderPicker({ onFocusChange });
    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocusChange).toHaveBeenCalledWith({ focused: true });

    onFocusChange.mockClear();
    rerender(<SingleDatePicker {...pickerProps({ disabled: true, onFocusChange })} />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocusChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox').disabled).toBe(true);
  });

  it('clears a date and can request reopening the picker', () => {
    const onDateChange = vi.fn();
    const onFocusChange = vi.fn();
    const { rerender } = renderPicker({
      date: selectedDate,
      focused: true,
      onDateChange,
      onFocusChange,
      showClearDate: true,
    });
    onFocusChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Date' }));
    expect(onDateChange).toHaveBeenCalledWith(null);
    expect(onFocusChange).not.toHaveBeenCalled();

    onDateChange.mockClear();
    onFocusChange.mockClear();
    rerender(
      <SingleDatePicker
        {...pickerProps({
          date: selectedDate,
          focused: true,
          onDateChange,
          onFocusChange,
          reopenPickerOnClearDate: true,
          showClearDate: true,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear Date' }));
    expect(onDateChange).toHaveBeenCalledWith(null);
    expect(onFocusChange).toHaveBeenCalledWith({ focused: true });
  });

  it('forwards calendar selection and close callbacks with Luxon payloads', () => {
    const onDateChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    const { container } = renderPicker({
      focused: true,
      onClose,
      onDateChange,
      onFocusChange,
    });
    fireEvent.click(dayButton(container, '2099-02-14'));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onDateChange.mock.calls[0][0]).toBeInstanceOf(DateTime);
    expect(onDateChange.mock.calls[0][0].toISODate()).toBe('2099-02-14');
    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).toHaveBeenCalledWith({ date: onDateChange.mock.calls[0][0] });
  });

  it('closes on an outside click and ignores clicks inside the picker', () => {
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    const { container } = renderPicker({ focused: true, onClose, onFocusChange });
    onFocusChange.mockClear();
    fireEvent.mouseDown(dayButton(container, '2099-02-14'));
    expect(onFocusChange).not.toHaveBeenCalled();
    fireEvent.mouseDown(document.body);
    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).toHaveBeenCalledWith({ date: null });
  });

  it('renders a body portal, locks scroll, and restores it on close and unmount', () => {
    const onFocusChange = vi.fn();
    const { rerender, unmount } = renderPicker({
      appendToBody: true,
      disableScroll: true,
      focused: true,
      onFocusChange,
      withPortal: true,
    });
    const scrollRoot = document.scrollingElement || document.documentElement;
    expect(document.body.querySelector('.SingleDatePicker_picker')).toBeTruthy();
    expect(scrollRoot.style.overflow).toBe('hidden');

    rerender(<SingleDatePicker {...pickerProps({ appendToBody: true, focused: false, onFocusChange, withPortal: true })} />);
    expect(scrollRoot.style.overflow).toBe('');
    unmount();
    expect(document.body.querySelector('.SingleDatePicker_picker')).toBeNull();
  });

  it('renders a full-screen portal close control and closes through it', () => {
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    renderPicker({ focused: true, onClose, onFocusChange, withFullScreenPortal: true });
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toBeTruthy();
    fireEvent.click(close);
    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).toHaveBeenCalledWith({ date: null });
  });

  it('marks blocked and out-of-range days and disables navigation at min/max limits', () => {
    const { container } = renderPicker({
      focused: true,
      isDayBlocked: (day) => day.toISODate() === '2099-02-10',
      isOutsideRange: (day) => day.toISODate() === '2099-02-11',
      minDate: DateTime.fromISO('2099-02-05', { zone: 'UTC' }),
      maxDate: DateTime.fromISO('2099-02-20', { zone: 'UTC' }),
    });
    expect(dayButton(container, '2099-02-10').getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(container, '2099-02-10').className).toContain('CalendarDay__blocked_calendar');
    expect(dayButton(container, '2099-02-11').className).toContain('CalendarDay__blocked_out_of_range');
    expect(screen.getByRole('button', { name: /previous month/i }).getAttribute('aria-disabled'))
      .toBe('true');
    expect(screen.getByRole('button', { name: /next month/i }).getAttribute('aria-disabled'))
      .toBe('true');
  });

  it('supports vertical, RTL, open-up, and right-anchored presentation', () => {
    const { container, rerender } = renderPicker({
      anchorDirection: ANCHOR_RIGHT,
      focused: true,
      isRTL: true,
      openDirection: OPEN_UP,
      orientation: VERTICAL_ORIENTATION,
    });
    expect(container.querySelector('.SingleDatePickerInput__rtl')).toBeTruthy();
    expect(pickerRoot(container).className).toContain('SingleDatePicker_picker__rtl');
    expect(pickerRoot(container).className).toContain('SingleDatePicker_picker__directionRight');
    expect(pickerRoot(container).querySelector('.DayPicker_transitionContainer__vertical')).toBeTruthy();

    rerender(<SingleDatePicker {...pickerProps({ focused: true, isRTL: true, block: true })} />);
    expect(container.querySelector('.SingleDatePicker__block')).toBeTruthy();
  });

  it('forwards custom month, weekday, day, info, and navigation renderers', () => {
    const monthFormat = vi.fn((month) => `month:${month.toISODate()}`);
    const weekDayFormat = vi.fn((day) => `weekday:${day.toISODate()}`);
    const renderWeekHeaderElement = vi.fn((day) => <b data-testid="weekday">{day}</b>);
    const renderDayContents = vi.fn((day) => `day:${day.day}`);
    const renderCalendarInfo = () => <aside data-testid="info">Helpful info</aside>;
    const renderNavPrevButton = ({ ariaLabel, onClick }) => (
      <button aria-label={ariaLabel} onClick={onClick} type="button">Previous</button>
    );
    const { container } = renderPicker({
      focused: true,
      monthFormat,
      renderCalendarInfo,
      renderDayContents,
      renderNavPrevButton,
      renderWeekHeaderElement,
      weekDayFormat,
    });

    expect(screen.getByText('month:2099-02-01')).toBeTruthy();
    expect(screen.getAllByTestId('weekday')).toHaveLength(7);
    expect(dayButton(container, '2099-02-14').textContent).toBe('day:14');
    expect(screen.getByTestId('info')).toBeTruthy();
    expect(screen.getByRole('button', { name: /previous month/i })).toBeTruthy();
    expect(monthFormat.mock.calls[0][0]).toBeInstanceOf(DateTime);
    expect(weekDayFormat.mock.calls[0][0]).toBeInstanceOf(DateTime);
  });

  it('supports clear and calendar icon accessibility actions', () => {
    const onFocusChange = vi.fn();
    const customInputIcon = <span data-testid="calendar-icon">Calendar</span>;
    renderPicker({
      customInputIcon,
      onFocusChange,
      showDefaultInputIcon: true,
    });
    const iconButton = screen.getByRole('button', { name: 'Open calendar.' });
    expect(screen.getByTestId('calendar-icon')).toBeTruthy();
    fireEvent.click(iconButton);
    expect(onFocusChange).toHaveBeenCalledWith({ focused: true });
  });
});
