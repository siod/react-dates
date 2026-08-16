import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DayPickerSingleDateController from '../../../../src/components/DayPickerSingleDateController.jsx';
import {
  INFO_POSITION_AFTER, VERTICAL_SCROLLABLE,
} from '../../../../src/constants.js';
import { renderStrict } from '../../../helpers/index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const initialMonth = DateTime.fromISO('2099-02-01', { zone: 'UTC' }).setLocale('en-US');
const selectedDate = DateTime.fromISO('2099-02-14', { zone: 'UTC' }).setLocale('en-US');

function controllerProps(overrides = {}) {
  return {
    focused: true,
    isFocused: true,
    initialVisibleMonth: () => initialMonth,
    dayAriaLabelFormat: (day) => day.toISODate(),
    transitionDuration: 0,
    isOutsideRange: () => false,
    isDayBlocked: () => false,
    ...overrides,
  };
}

function renderController(overrides = {}) {
  return renderStrict(<DayPickerSingleDateController {...controllerProps(overrides)} />);
}

function dayButton(container, isoDate) {
  const visible = container.querySelector(`.CalendarMonth[data-visible="true"] [aria-label="${isoDate}"]`);
  if (visible) return visible;
  const dayOfMonth = String(Number(isoDate.slice(-2)));
  return Array.from(container.querySelectorAll('.CalendarMonth[data-visible="true"] .CalendarDay'))
    .find((day) => day.textContent === dayOfMonth);
}

function visibleMonths(container) {
  return Array.from(container.querySelectorAll('.CalendarMonth[data-visible="true"]'));
}

describe('DayPickerSingleDateController observable behavior', () => {
  it('renders a focused accessible picker and honors initialVisibleMonth over date', () => {
    const { container } = renderController({ date: DateTime.fromISO('2099-04-10', { zone: 'UTC' }) });
    const application = screen.getByRole('application');

    expect(application.getAttribute('aria-label')).toBe('Calendar');
    expect(container.firstElementChild.getAttribute('dir')).toBe('ltr');
    expect(visibleMonths(container)).toHaveLength(1);
    expect(screen.getByText('February 2099')).toBeTruthy();
    expect(dayButton(container, '2099-02-01').getAttribute('tabindex')).toBe('0');
  });

  it('selects an available day and emits Luxon date, focus, and close payloads', () => {
    const onDateChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    const { container } = renderController({ onClose, onDateChange, onFocusChange });

    fireEvent.click(dayButton(container, '2099-02-14'));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(DateTime.isDateTime(onDateChange.mock.calls[0][0])).toBe(true);
    expect(onDateChange.mock.calls[0][0].toISODate()).toBe('2099-02-14');
    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).toHaveBeenCalledWith({ date: onDateChange.mock.calls[0][0] });
  });

  it('supports optional unselection and keeps the picker open when requested', () => {
    const onDateChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    const { container, rerender } = renderController({
      allowUnselect: true,
      date: selectedDate,
      onClose,
      onDateChange,
      onFocusChange,
    });

    fireEvent.click(dayButton(container, '2099-02-14'));
    expect(onDateChange).toHaveBeenCalledWith(null);
    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).toHaveBeenCalledWith({ date: null });

    onDateChange.mockClear();
    onFocusChange.mockClear();
    onClose.mockClear();
    rerender(
      <DayPickerSingleDateController
        {...controllerProps({
          date: selectedDate,
          keepOpenOnDateSelect: true,
          onClose,
          onDateChange,
          onFocusChange,
        })}
      />,
    );
    fireEvent.click(dayButton(container, '2099-02-14'));
    expect(onDateChange).toHaveBeenCalledWith(selectedDate);
    expect(onFocusChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders selected, blocked, out-of-range, highlighted, and valid modifiers', () => {
    const { container } = renderController({
      date: selectedDate,
      isDayBlocked: (day) => day.toISODate() === '2099-02-10',
      isDayHighlighted: (day) => day.toISODate() === '2099-02-12',
      isOutsideRange: (day) => day.toISODate() === '2099-02-11',
    });

    expect(dayButton(container, '2099-02-14').className).toContain('CalendarDay__selected');
    expect(dayButton(container, '2099-02-10').className).toContain('CalendarDay__blocked_calendar');
    expect(dayButton(container, '2099-02-11').className).toContain('CalendarDay__blocked_out_of_range');
    expect(dayButton(container, '2099-02-12').className).toContain('CalendarDay__highlighted_calendar');
    expect(dayButton(container, '2099-02-10').getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(container, '2099-02-09').getAttribute('aria-disabled')).toBe('false');
  });

  it('marks the current local day and weekday boundary modifiers', () => {
    const today = DateTime.local().setLocale('en-US');
    const { container } = renderController({
      initialVisibleMonth: () => today.startOf('month'),
    });
    const todayCell = dayButton(container, today.toISODate());

    expect(todayCell.className).toContain('CalendarDay__today');
    expect(container.querySelectorAll('.CalendarDay__firstDayOfWeek').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.CalendarDay__lastDayOfWeek').length).toBeGreaterThan(0);
  });

  it('rejects blocked dates without invoking selection callbacks', () => {
    const onDateChange = vi.fn();
    const onFocusChange = vi.fn();
    const onClose = vi.fn();
    const { container } = renderController({
      isDayBlocked: (day) => day.toISODate() === '2099-02-10',
      onClose,
      onDateChange,
      onFocusChange,
    });

    fireEvent.click(dayButton(container, '2099-02-10'));
    expect(onDateChange).not.toHaveBeenCalled();
    expect(onFocusChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('updates selected and blocked rendering when relevant props change', () => {
    const { container, rerender } = renderController({ date: selectedDate });
    expect(dayButton(container, '2099-02-14').className).toContain('CalendarDay__selected');

    rerender(
      <DayPickerSingleDateController
        {...controllerProps({
          date: DateTime.fromISO('2099-02-18', { zone: 'UTC' }).setLocale('en-US'),
          isDayBlocked: (day) => day.toISODate() === '2099-02-18',
        })}
      />,
    );

    expect(dayButton(container, '2099-02-14').className).not.toContain('CalendarDay__selected');
    expect(dayButton(container, '2099-02-18').className).toContain('CalendarDay__selected');
    expect(dayButton(container, '2099-02-18').className).toContain('CalendarDay__blocked_calendar');
  });

  it('enforces navigation limits and forwards month callback payloads', () => {
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    const { container } = renderController({
      maxDate: DateTime.fromISO('2099-03-20', { zone: 'UTC' }),
      minDate: DateTime.fromISO('2099-02-05', { zone: 'UTC' }),
      onNextMonthClick,
      onPrevMonthClick,
    });
    const previous = screen.getByRole('button', { name: /previous month/i });
    const next = screen.getByRole('button', { name: /next month/i });

    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(next.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(previous);
    fireEvent.click(next);
    expect(onPrevMonthClick).not.toHaveBeenCalled();
    expect(onNextMonthClick).toHaveBeenCalledTimes(1);
    expect(DateTime.isDateTime(onNextMonthClick.mock.calls[0][0])).toBe(true);
    expect(onNextMonthClick.mock.calls[0][0].toISODate()).toBe('2099-03-01');
    expect(visibleMonths(container)).toHaveLength(1);
  });

  it('loads additional months for vertical-scrollable navigation', () => {
    const { container } = renderController({
      numberOfMonths: 1,
      orientation: VERTICAL_SCROLLABLE,
      verticalHeight: 500,
    });
    const next = screen.getByRole('button', { name: /next month/i });
    const previous = screen.getByRole('button', { name: /previous month/i });

    fireEvent.click(next);
    expect(visibleMonths(container).length).toBeGreaterThan(1);
    fireEvent.click(previous);
    expect(visibleMonths(container).length).toBeGreaterThan(1);
  });

  it('forwards custom captions, weekday/day renderers, and calendar info', () => {
    const monthFormat = vi.fn((month) => `month:${month.toISODate()}`);
    const weekDayFormat = vi.fn((day) => `weekday:${day.toISODate()}`);
    const renderWeekHeaderElement = vi.fn((day) => <b data-testid="weekday">{day}</b>);
    const renderDayContents = vi.fn((day) => `day:${day.day}`);
    const renderCalendarInfo = () => <aside data-testid="info">Calendar info</aside>;
    const { container } = renderController({
      monthFormat,
      renderCalendarInfo,
      renderDayContents,
      renderWeekHeaderElement,
      weekDayFormat,
      calendarInfoPosition: INFO_POSITION_AFTER,
    });

    expect(screen.getByText('month:2099-02-01')).toBeTruthy();
    expect(screen.getAllByTestId('weekday')).toHaveLength(7);
    expect(dayButton(container, '2099-02-14').textContent).toBe('day:14');
    expect(screen.getByTestId('info')).toBeTruthy();
    expect(monthFormat.mock.calls[0][0]).toBeInstanceOf(DateTime);
    expect(weekDayFormat.mock.calls[0][0]).toBeInstanceOf(DateTime);
    expect(renderDayContents.mock.calls.some(([day]) => DateTime.isDateTime(day))).toBe(true);
  });

  it('exposes the selected date as the focusable day and forwards blur/tab callbacks', async () => {
    const onBlur = vi.fn();
    const onTab = vi.fn();
    const onShiftTab = vi.fn();
    const { container } = renderController({ onBlur, onShiftTab, onTab });
    const application = screen.getByRole('application');

    expect(dayButton(container, '2099-02-01').getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(application, { key: 'Escape' });
    expect(onBlur).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 250));
    fireEvent.keyDown(application, { key: 'Tab' });
    await new Promise((resolve) => setTimeout(resolve, 250));
    fireEvent.keyDown(application, { key: 'Tab', shiftKey: true });
    expect(onTab).toHaveBeenCalledTimes(1);
    expect(onShiftTab).toHaveBeenCalledTimes(1);
  });

  it('updates hover modifiers for a non-touch pointer', () => {
    const controllerRef = React.createRef();
    const { container } = renderController({ ref: controllerRef });
    controllerRef.current.isTouchDevice = false;
    const day = dayButton(container, '2099-02-15');

    fireEvent.mouseEnter(day);
    expect(controllerRef.current.state.hoverDate.toISODate()).toBe('2099-02-15');
    fireEvent.mouseLeave(day);
    expect(controllerRef.current.state.hoverDate).toBeNull();
  });
});
