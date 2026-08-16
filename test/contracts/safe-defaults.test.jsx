import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CalendarDay from '../../src/components/CalendarDay.jsx';
import CalendarMonth from '../../src/components/CalendarMonth.jsx';
import CalendarMonthGrid from '../../src/components/CalendarMonthGrid.jsx';
import DateInput from '../../src/components/DateInput.jsx';
import DateRangePicker from '../../src/components/DateRangePicker.jsx';
import DateRangePickerInputController from '../../src/components/DateRangePickerInputController.jsx';
import DayPicker from '../../src/components/DayPicker.jsx';
import DayPickerKeyboardShortcuts from '../../src/components/DayPickerKeyboardShortcuts.jsx';
import DayPickerNavigation from '../../src/components/DayPickerNavigation.jsx';
import DayPickerRangeController from '../../src/components/DayPickerRangeController.jsx';
import DayPickerSingleDateController from '../../src/components/DayPickerSingleDateController.jsx';
import SingleDatePicker from '../../src/components/SingleDatePicker.jsx';
import SingleDatePickerInput from '../../src/components/SingleDatePickerInput.jsx';
import SingleDatePickerInputController from '../../src/components/SingleDatePickerInputController.jsx';
import { START_DATE } from '../../src/constants.js';
import { renderStrict } from '../helpers/index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const month = DateTime.fromISO('2099-02-01', { zone: 'UTC' }).setLocale('en-US');
const day = DateTime.fromISO('2099-02-14', { zone: 'UTC' }).setLocale('en-US');

function calendarDay(container, dayOfMonth = '14') {
  return Array.from(container.querySelectorAll('.CalendarDay'))
    .find((element) => element.textContent === dayOfMonth);
}

describe('safe default callback contracts', () => {
  it('keeps CalendarDay defaults safe for pointer and keyboard interaction', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr><CalendarDay day={day} /></tr>
        </tbody>
      </table>,
    );
    const button = screen.getByRole('button');

    expect(() => {
      fireEvent.focus(button);
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);
    }).not.toThrow();
    expect(calendarDay(container)).toBe(button);
  });

  it('keeps CalendarMonth and CalendarMonthGrid defaults safe when days are activated', () => {
    const { container: monthContainer } = render(<CalendarMonth month={month} isVisible />);
    expect(() => {
      const dateCell = calendarDay(monthContainer);
      fireEvent.mouseEnter(dateCell);
      fireEvent.mouseLeave(dateCell);
      fireEvent.click(dateCell);
    }).not.toThrow();

    const { container: gridContainer } = render(
      <CalendarMonthGrid
        initialMonth={month}
        numberOfMonths={1}
        transitionDuration={0}
      />,
    );
    expect(() => {
      fireEvent.click(calendarDay(gridContainer));
      fireEvent.transitionEnd(gridContainer.querySelector('.CalendarMonthGrid'));
    }).not.toThrow();
  });

  it('keeps DateInput defaults safe for focus, editing, and navigation keys', async () => {
    render(<DateInput id="date" />);
    const input = screen.getByRole('textbox');

    expect(() => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '2099-02-14' } });
      fireEvent.keyDown(input, { key: 'Tab' });
      fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: '?' });
    }).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 320));
  });

  it('keeps SingleDatePickerInput defaults safe for icons, clear, and editing', () => {
    render(
      <SingleDatePickerInput
        id="date"
        showClearDate
        showDefaultInputIcon
      />,
    );
    const input = screen.getByRole('textbox');

    expect(() => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '2099-02-14' } });
      fireEvent.click(screen.getByRole('button', { name: 'Open calendar.' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear Date' }));
    }).not.toThrow();
  });

  it('keeps single and range input controllers safe with omitted optional callbacks', () => {
    const singleDateChange = vi.fn();
    const { rerender } = renderStrict(
      <SingleDatePickerInputController
        id="date"
        onDateChange={singleDateChange}
        onFocusChange={vi.fn()}
        focused
        isFocused
        keepOpenOnDateSelect
      />,
    );
    expect(() => {
      fireEvent.focus(screen.getByRole('textbox'));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'not-a-date' } });
    }).not.toThrow();

    rerender(
      <DateRangePickerInputController
        startDateId="start"
        endDateId="end"
        isStartDateFocused
        startDate={null}
        endDate={null}
        showClearDates
      />,
    );
    expect(() => {
      fireEvent.focus(screen.getAllByRole('textbox')[0]);
      fireEvent.focus(screen.getAllByRole('textbox')[1]);
      fireEvent.click(screen.getByRole('button', { name: 'Clear Dates' }));
    }).not.toThrow();
  });

  it('keeps DayPicker and navigation defaults safe for rendered navigation and date actions', () => {
    const { container } = renderStrict(
      <DayPicker
        initialVisibleMonth={() => month}
        numberOfMonths={1}
        isFocused
        transitionDuration={0}
      />,
    );
    const previous = screen.getByRole('button', { name: /previous month/i });
    const next = screen.getByRole('button', { name: /next month/i });

    expect(() => {
      fireEvent.click(previous);
      fireEvent.click(next);
      fireEvent.keyUp(previous, { key: 'Enter' });
      fireEvent.keyUp(next, { key: ' ' });
      fireEvent.click(calendarDay(container));
      fireEvent.keyDown(screen.getByRole('application'), { key: 'Tab' });
    }).not.toThrow();

    const standalone = render(<DayPickerNavigation />);
    expect(() => {
      fireEvent.click(standalone.container.querySelector('[aria-label*="backward"]'));
      fireEvent.click(standalone.container.querySelector('[aria-label*="forward"]'));
    }).not.toThrow();
  });

  it('keeps keyboard shortcut defaults safe when opening and closing the panel', () => {
    const { rerender } = render(<DayPickerKeyboardShortcuts />);
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /open the keyboard shortcuts/i }));
    }).not.toThrow();

    rerender(<DayPickerKeyboardShortcuts showKeyboardShortcutsPanel />);
    const dialog = screen.getByRole('dialog');
    expect(() => {
      fireEvent.keyDown(dialog.querySelector('button'), { key: 'Escape' });
      fireEvent.click(dialog.querySelector('button'));
    }).not.toThrow();
  });

  it('keeps single and range controller defaults safe through date clicks', () => {
    const { container: singleContainer } = renderStrict(
      <DayPickerSingleDateController
        focused
        isFocused
        initialVisibleMonth={() => month}
        isOutsideRange={() => false}
        dayAriaLabelFormat={(value) => value.toISODate()}
        transitionDuration={0}
        numberOfMonths={1}
      />,
    );
    expect(() => fireEvent.click(calendarDay(singleContainer))).not.toThrow();

    const { container: rangeContainer } = renderStrict(
      <DayPickerRangeController
        focusedInput={START_DATE}
        isFocused
        initialVisibleMonth={() => month}
        isOutsideRange={() => false}
        dayAriaLabelFormat={(value) => value.toISODate()}
        transitionDuration={0}
        numberOfMonths={1}
      />,
    );
    expect(() => fireEvent.click(calendarDay(rangeContainer))).not.toThrow();
  });

  it('keeps picker shell defaults safe when opened and navigated without callbacks', () => {
    const { container } = renderStrict(
      <SingleDatePicker
        focused
        initialVisibleMonth={() => month}
        isOutsideRange={() => false}
        onFocusChange={vi.fn()}
        numberOfMonths={1}
        transitionDuration={0}
      />,
    );
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /next month/i }));
      fireEvent.click(calendarDay(container));
    }).not.toThrow();

    cleanup();
    renderStrict(
      <DateRangePicker
        focusedInput={START_DATE}
        initialVisibleMonth={() => month}
        isOutsideRange={() => false}
        onFocusChange={vi.fn()}
        numberOfMonths={1}
        transitionDuration={0}
      />,
    );
    expect(screen.getAllByRole('application').length).toBeGreaterThan(0);
  });

  it('exposes callable defaults for non-render lifecycle hooks', () => {
    const defaults = [
      [CalendarMonth, ['onMonthSelect', 'onYearSelect']],
      [CalendarMonthGrid, ['onMonthChange', 'onYearChange', 'onMonthTransitionEnd']],
      [DayPicker, [
        'onOutsideClick', 'onMonthChange', 'onYearChange', 'onGetNextScrollableMonths',
        'onGetPrevScrollableMonths', 'onBlur', 'onTab', 'onShiftTab',
      ]],
      [DayPickerSingleDateController, [
        'onDateChange', 'onFocusChange', 'onClose', 'onBlur', 'onTab', 'onShiftTab',
        'onPrevMonthClick', 'onNextMonthClick',
      ]],
      [DayPickerRangeController, [
        'onDatesChange', 'onFocusChange', 'onClose', 'onBlur', 'onTab', 'onShiftTab',
        'onPrevMonthClick', 'onNextMonthClick',
      ]],
      [SingleDatePicker, ['onPrevMonthClick', 'onNextMonthClick', 'onClose']],
      [DateRangePicker, ['onPrevMonthClick', 'onNextMonthClick', 'onClose']],
    ];

    defaults.forEach(([Component, names]) => {
      names.forEach((name) => {
        const callback = Component.defaultProps[name];
        expect(callback, `${Component.displayName || Component.name}.${name}`).toBeTypeOf('function');
        expect(() => callback()).not.toThrow();
      });
    });
  });
});
