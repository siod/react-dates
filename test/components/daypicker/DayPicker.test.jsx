import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, createEvent, fireEvent, screen, waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DayPicker from '../../../src/components/DayPicker.jsx';
import {
  INFO_POSITION_AFTER,
  NAV_POSITION_BOTTOM,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
} from '../../../src/constants.js';
import { renderStrict } from '../../helpers/index.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const initialMonth = DateTime.fromISO('2024-02-01', { zone: 'UTC' }).setLocale('en-US');

const defaultProps = {
  initialVisibleMonth: () => initialMonth,
  numberOfMonths: 1,
  transitionDuration: 0,
};

function renderPicker(overrides = {}) {
  return renderStrict(<DayPicker {...defaultProps} {...overrides} />);
}

function visibleMonths(container) {
  return Array.from(container.querySelectorAll('.CalendarMonth[data-visible="true"]'));
}

function visibleDay(container, dayOfMonth) {
  return visibleMonths(container)
    .flatMap((month) => Array.from(month.querySelectorAll('.CalendarDay')))
    .find((day) => day.textContent === String(dayOfMonth));
}

function forceDesktopPointer() {
  const hadTouchStart = 'ontouchstart' in window;
  const previousTouchStart = window.ontouchstart;
  const hadTouchPoints = Object.prototype.hasOwnProperty.call(navigator, 'maxTouchPoints');
  const previousTouchPoints = navigator.maxTouchPoints;

  if (hadTouchStart) delete window.ontouchstart;
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: 0,
  });

  return () => {
    if (hadTouchStart) {
      Object.defineProperty(window, 'ontouchstart', {
        configurable: true,
        value: previousTouchStart,
      });
    }
    if (hadTouchPoints) {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        value: previousTouchPoints,
      });
    } else {
      delete navigator.maxTouchPoints;
    }
  };
}

describe('DayPicker observable behavior', () => {
  it('renders an accessible application with visible months and seven-day headers', () => {
    const { container } = renderPicker({ numberOfMonths: 2 });
    const application = screen.getByRole('application');
    const headers = container.querySelectorAll('.DayPicker_weekHeader');

    expect(application.getAttribute('aria-label')).toBe('Calendar');
    expect(application.getAttribute('aria-roledescription')).toBe('datepicker');
    expect(visibleMonths(container)).toHaveLength(2);
    expect(headers).toHaveLength(2);
    Array.from(headers).forEach((header) => {
      expect(header.querySelectorAll('li')).toHaveLength(7);
    });
  });

  it('supports custom weekday, month, and day render callbacks with DateTimes', () => {
    const monthFormat = vi.fn((month) => `month:${month.toISODate()}`);
    const weekDayFormat = vi.fn((day) => `weekday:${day.toISODate()}`);
    const renderWeekHeaderElement = vi.fn((day) => <b data-testid="weekday">{day}</b>);
    const renderDayContents = vi.fn((day) => `day:${day.day}`);
    const { container } = renderPicker({
      monthFormat,
      renderDayContents,
      renderWeekHeaderElement,
      weekDayFormat,
    });

    expect(screen.getByText('month:2024-02-01')).toBeTruthy();
    expect(screen.getAllByTestId('weekday')).toHaveLength(7);
    expect(Array.from(visibleMonths(container)[0].querySelectorAll('.CalendarDay'))
      .some((day) => day.textContent === 'day:14')).toBe(true);
    expect(monthFormat).toHaveBeenCalledWith(expect.any(DateTime));
    expect(weekDayFormat).toHaveBeenCalledWith(expect.any(DateTime));
    expect(renderDayContents.mock.calls.some(([day]) => DateTime.isDateTime(day))).toBe(true);
    expect(container.querySelectorAll('.CalendarMonth[data-visible="true"]')).toHaveLength(1);
  });

  it('renders calendar info before or after the picker content', () => {
    const renderCalendarInfo = () => <aside data-testid="calendar-info">Helpful info</aside>;
    const { container, rerender } = renderPicker({
      calendarInfoPosition: INFO_POSITION_AFTER,
      renderCalendarInfo,
    });
    const info = screen.getByTestId('calendar-info');
    expect(info).toBeTruthy();
    expect(container.textContent).toContain('Helpful info');

    rerender(
      <DayPicker
        {...defaultProps}
        calendarInfoPosition="before"
        renderCalendarInfo={renderCalendarInfo}
      />,
    );
    expect(screen.getByTestId('calendar-info')).toBeTruthy();
  });

  it('passes rendered modifiers and day callbacks through to CalendarDay', () => {
    const onDayClick = vi.fn();
    const onDayMouseEnter = vi.fn();
    const onDayMouseLeave = vi.fn();
    const { container } = renderPicker({
      modifiers: {
        '2024-02': {
          '2024-02-14': new Set(['selected', 'blocked', 'blocked-calendar']),
        },
      },
      onDayClick,
      onDayMouseEnter,
      onDayMouseLeave,
    });
    const day = visibleDay(container, 14);

    expect(day.className).toContain('CalendarDay__selected');
    expect(day.className).toContain('CalendarDay__blocked_calendar');
    fireEvent.mouseEnter(day);
    fireEvent.mouseLeave(day);
    fireEvent.click(day);
    expect(onDayMouseEnter).toHaveBeenCalledWith(expect.any(DateTime), expect.anything());
    expect(onDayMouseLeave).toHaveBeenCalledWith(expect.any(DateTime), expect.anything());
    expect(onDayClick).toHaveBeenCalledWith(expect.any(DateTime), expect.anything());
  });

  it('supports custom month elements with month selection callbacks', () => {
    const renderMonthElement = vi.fn(({ month, onMonthSelect, onYearSelect, isVisible }) => (
      <div data-testid={`caption-${month.toISODate()}`}>
        <button onClick={() => onMonthSelect(month, 2)} type="button">Choose March</button>
        <button onClick={() => onYearSelect(month, 2025)} type="button">Choose year</button>
        {isVisible ? 'visible' : 'hidden'}
      </div>
    ));
    const onMonthChange = vi.fn();
    const onYearChange = vi.fn();
    const { container } = renderPicker({
      onMonthChange,
      onYearChange,
      renderMonthElement,
    });

    const visible = visibleMonths(container)[0];
    expect(visible.querySelector('[data-testid="caption-2024-02-01"]')).toBeTruthy();
    expect(renderMonthElement).toHaveBeenCalledWith(expect.objectContaining({
      month: expect.any(DateTime),
      onMonthSelect: expect.any(Function),
      onYearSelect: expect.any(Function),
      isVisible: true,
    }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose March' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose year' })[0]);
    expect(onMonthChange).toHaveBeenCalled();
    expect(onYearChange).toHaveBeenCalled();
  });

  it('renders RTL, vertical, vertical-scrollable, and bottom-navigation variants', () => {
    const { container, rerender } = renderPicker({ isRTL: true });
    expect(container.firstElementChild.getAttribute('dir')).toBe('rtl');

    rerender(<DayPicker {...defaultProps} orientation={VERTICAL_ORIENTATION} verticalHeight={400} />);
    expect(container.querySelectorAll('.DayPicker_weekHeader')).toHaveLength(1);
    expect(container.querySelector('.DayPicker_transitionContainer__vertical')).toBeTruthy();

    rerender(<DayPicker {...defaultProps} orientation={VERTICAL_SCROLLABLE} verticalHeight={400} />);
    expect(container.querySelector('.DayPicker_transitionContainer__verticalScrollable')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /switch to the/ })).toHaveLength(2);

    rerender(<DayPicker {...defaultProps} navPosition={NAV_POSITION_BOTTOM} />);
    expect(container.querySelector('.DayPickerNavigation__bottom')).toBeTruthy();
  });

  it('hides navigation and shortcuts when requested', () => {
    const { container, rerender } = renderPicker({ hideKeyboardShortcutsPanel: true, noNavButtons: true });
    expect(container.querySelectorAll('[aria-label*="switch to the"]').length).toBe(0);
    expect(screen.queryByRole('button', { name: 'Open the keyboard shortcuts panel.' })).toBeNull();

    rerender(<DayPicker {...defaultProps} noNavNextButton />);
    expect(screen.queryByRole('button', { name: 'Move forward to switch to the next month.' })).toBeNull();
  });

  it('moves focus by one day and one week from the focused calendar application', () => {
    const { container } = renderPicker({ isFocused: true });
    const application = screen.getByRole('application');
    expect(visibleDay(container, 1).getAttribute('tabindex')).toBe('0');

    const rightEvent = createEvent.keyDown(application, { key: 'ArrowRight' });
    fireEvent(application, rightEvent);
    expect(rightEvent.defaultPrevented).toBe(true);
    expect(visibleDay(container, 2).getAttribute('tabindex')).toBe('0');
  });

  it('accepts navigation immediately after selecting the focused day', () => {
    const onDayClick = vi.fn();
    const { container } = renderPicker({ isFocused: true, onDayClick });
    const application = screen.getByRole('application');

    fireEvent.keyDown(application, { key: 'ArrowRight' });
    const focusedDay = visibleDay(container, 2);
    fireEvent.keyDown(focusedDay, { key: 'Enter' });
    fireEvent.keyDown(application, { key: 'ArrowRight' });

    expect(onDayClick).toHaveBeenCalledTimes(1);
    expect(visibleDay(container, 3).getAttribute('tabindex')).toBe('0');
  });

  it('implements Home, End, PageUp, and PageDown through rendered focus state', () => {
    const keys = [
      ['Home', 11],
      ['End', 17],
    ];
    keys.forEach(([key, day]) => {
      const { container } = renderPicker({
        getFirstFocusableDay: () => DateTime.fromISO('2024-02-14', { zone: 'UTC' }).setLocale('en-US'),
        isFocused: true,
      });
      fireEvent.keyDown(screen.getByRole('application'), { key });
      expect(visibleDay(container, day).getAttribute('tabindex')).toBe('0');
      cleanup();
    });

    const { container } = renderPicker({ isFocused: true });
    fireEvent.keyDown(screen.getByRole('application'), { key: 'PageDown' });
    expect(visibleMonths(container).some((month) => month.textContent.includes('March 2024'))).toBe(true);
    cleanup();

    const previous = renderPicker({ isFocused: true });
    fireEvent.keyDown(screen.getByRole('application'), { key: 'PageUp' });
    expect(previous.container.textContent).toContain('January 2024');
  });

  it('honors RTL horizontal arrow direction', () => {
    const { container } = renderPicker({ isFocused: true, isRTL: true });
    fireEvent.keyDown(screen.getByRole('application'), { key: 'ArrowRight' });
    expect(visibleDay(container, 31).getAttribute('tabindex')).toBe('0');
  });

  it('opens shortcuts, closes with Escape, and delegates Tab navigation', async () => {
    const restoreTouch = forceDesktopPointer();
    const onBlur = vi.fn();
    const onTab = vi.fn();
    const onShiftTab = vi.fn();
    const { container } = renderPicker({ isFocused: true, onBlur, onShiftTab, onTab });
    const application = screen.getByRole('application');

    fireEvent.keyDown(application, { key: '?' });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(container.querySelector('[aria-label="Close the shortcuts panel."]')).toBeTruthy();
    fireEvent.keyDown(
      screen.getByRole('dialog').querySelector('button'),
      { key: 'Escape' },
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    renderPicker({ isFocused: true, onBlur, onShiftTab, onTab });
    const freshApplication = screen.getByRole('application');
    fireEvent.keyDown(freshApplication, { key: 'Tab' });
    await new Promise((resolve) => setTimeout(resolve, 250));
    fireEvent.keyDown(freshApplication, { key: 'Tab', shiftKey: true });
    expect(onTab).toHaveBeenCalled();
    expect(onShiftTab).toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
    restoreTouch();
  });

  it('delegates Escape to onBlur when shortcuts are closed', () => {
    const onBlur = vi.fn();
    renderPicker({ isFocused: true, onBlur });
    fireEvent.keyDown(screen.getByRole('application'), { key: 'Escape' });
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('calls custom navigation render callbacks with accessible controls', () => {
    const renderNavPrevButton = vi.fn(({ ariaLabel, onClick }) => (
      <button aria-label={ariaLabel} onClick={onClick} type="button">Previous custom</button>
    ));
    const renderNavNextButton = vi.fn(({ ariaLabel, onClick }) => (
      <button aria-label={ariaLabel} onClick={onClick} type="button">Next custom</button>
    ));
    renderPicker({ renderNavNextButton, renderNavPrevButton });

    expect(renderNavPrevButton).toHaveBeenCalledWith(expect.objectContaining({
      ariaLabel: 'Move backward to switch to the previous month.',
      onClick: expect.any(Function),
    }));
    expect(renderNavNextButton).toHaveBeenCalledWith(expect.objectContaining({
      ariaLabel: 'Move forward to switch to the next month.',
      onClick: expect.any(Function),
    }));
    expect(screen.getByRole('button', { name: 'Move backward to switch to the previous month.' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Move forward to switch to the next month.' })).toBeTruthy();
  });
});
