import React from 'react';
import { DateTime } from 'luxon';
import {
  act, cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CalendarMonth from '../../../src/components/CalendarMonth.jsx';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const month = DateTime.fromISO('2024-02-01').setLocale('en-US');

describe('CalendarMonth legacy observable behavior', () => {
  it.each([
    [true, 'true'],
    [false, 'false'],
  ])('sets data-visible to %s when isVisible is %s', (isVisible, expected) => {
    const { container } = render(<CalendarMonth month={month} isVisible={isVisible} />);
    expect(container.querySelector('.CalendarMonth').getAttribute('data-visible')).toBe(expected);
  });

  it('renders the correctly formatted month title', () => {
    const { container } = render(<CalendarMonth month={month} />);
    expect(container.querySelector('strong').textContent).toBe('February 2024');
  });

  it('renders a seven-column calendar table with Luxon dates', () => {
    const { container } = render(
      <CalendarMonth month={month} enableOutsideDays />,
    );
    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows.length).toBeGreaterThanOrEqual(4);
    rows.forEach((row) => expect(row.querySelectorAll('td')).toHaveLength(7));
    expect(screen.getAllByRole('button').some((cell) => cell.textContent === '29')).toBe(true);
  });

  it('passes a changed month and selection callbacks to renderMonthElement', () => {
    const renderMonthElement = vi.fn(({ month: renderedMonth, onMonthSelect, onYearSelect, isVisible }) => (
      <div data-testid="month-element">
        {renderedMonth.toISODate()}-{String(isVisible)}-{typeof onMonthSelect}-{typeof onYearSelect}
      </div>
    ));
    const { rerender } = render(
      <CalendarMonth month={month} renderMonthElement={renderMonthElement} />,
    );
    expect(screen.getByTestId('month-element').textContent)
      .toBe('2024-02-01-true-function-function');

    const previousCalls = renderMonthElement.mock.calls.length;
    const changedMonth = month.minus({ months: 1 });
    rerender(<CalendarMonth month={changedMonth} renderMonthElement={renderMonthElement} />);
    expect(renderMonthElement.mock.calls.length).toBeGreaterThan(previousCalls);
    expect(renderMonthElement.mock.lastCall[0].month.toISODate()).toBe('2024-01-01');
  });

  it('uses a custom calendar-day renderer and forwards day props', () => {
    const renderCalendarDay = vi.fn(({ day, isOutsideDay, tabIndex }) => (
      <td
        role="button"
        data-testid={day ? `day-${day.toISODate()}` : 'empty-day'}
        data-outside={String(isOutsideDay)}
        tabIndex={tabIndex}
      >
        {day ? day.day : ''}
      </td>
    ));
    render(
      <CalendarMonth
        month={month}
        enableOutsideDays
        renderCalendarDay={renderCalendarDay}
        focusedDate={DateTime.fromISO('2024-02-10')}
      />,
    );

    expect(screen.getByTestId('day-2024-02-10').getAttribute('tabindex')).toBe('0');
    expect(renderCalendarDay).toHaveBeenCalled();
    expect(renderCalendarDay.mock.calls.some(([props]) => props.day?.toISODate() === '2024-02-10'))
      .toBe(true);
    expect(screen.queryAllByTestId('empty-day')).toHaveLength(0);
  });

  it('forwards day clicks with the selected Luxon DateTime', () => {
    const onDayClick = vi.fn();
    render(<CalendarMonth month={month} onDayClick={onDayClick} />);
    const dayCell = screen.getAllByRole('button').find((cell) => cell.textContent === '10');
    fireEvent.click(dayCell);
    expect(onDayClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, month: 2, day: 10 }),
      expect.any(Object),
    );
  });

  it('calls setMonthTitleHeight after mounting and when the callback is reattached', () => {
    vi.useFakeTimers();
    const setMonthTitleHeight = vi.fn();
    const { rerender } = render(
      <CalendarMonth month={month} setMonthTitleHeight={setMonthTitleHeight} />,
    );
    act(() => vi.runAllTimers());
    expect(setMonthTitleHeight).toHaveBeenCalledTimes(1);

    rerender(<CalendarMonth month={month} setMonthTitleHeight={null} />);
    rerender(<CalendarMonth month={month} setMonthTitleHeight={setMonthTitleHeight} />);
    act(() => vi.runAllTimers());
    expect(setMonthTitleHeight).toHaveBeenCalledTimes(2);
  });
});
