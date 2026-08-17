import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CalendarMonthGrid from '../../../src/components/CalendarMonthGrid.jsx';
import { VERTICAL_SCROLLABLE } from '../../../src/constants';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const initialMonth = DateTime.fromISO('2024-02-01').setLocale('en-US');

describe('CalendarMonthGrid legacy observable behavior', () => {
  it('renders numberOfMonths plus two transition months', () => {
    const { container } = render(
      <CalendarMonthGrid initialMonth={initialMonth} numberOfMonths={5} />,
    );
    expect(container.querySelectorAll('.CalendarMonth')).toHaveLength(7);
  });

  it('applies the requested horizontal transform style', () => {
    const { container } = render(
      <CalendarMonthGrid initialMonth={initialMonth} translationValue={100} />,
    );
    const grid = container.querySelector('.CalendarMonthGrid');
    expect(grid.style.transform).toBe('translateX(100px)');
    expect(grid.style.msTransform).toBe('translateX(100px)');
    expect(grid.style.MozTransform).toBe('translateX(100px)');
    expect(grid.style.WebkitTransform).toBe('translateX(100px)');
  });

  it('does not generate duplicate month keys or captions', () => {
    const { container } = render(
      <CalendarMonthGrid initialMonth={initialMonth} numberOfMonths={12} />,
    );
    const captions = [...container.querySelectorAll('.CalendarMonth_caption strong')]
      .map((caption) => caption.textContent);
    expect(new Set(captions).size).toBe(captions.length);
  });

  it('keeps the same month set when unchanged props are rendered again', () => {
    const { container, rerender } = render(
      <CalendarMonthGrid initialMonth={initialMonth} numberOfMonths={12} />,
    );
    const before = [...container.querySelectorAll('.CalendarMonth_caption strong')]
      .map((caption) => caption.textContent);
    rerender(<CalendarMonthGrid initialMonth={initialMonth} numberOfMonths={12} />);
    const after = [...container.querySelectorAll('.CalendarMonth_caption strong')]
      .map((caption) => caption.textContent);
    expect(after).toEqual(before);
  });

  it('updates the month set when numberOfMonths changes', () => {
    const { container, rerender } = render(
      <CalendarMonthGrid initialMonth={initialMonth} numberOfMonths={1} />,
    );
    expect(container.querySelectorAll('.CalendarMonth')).toHaveLength(3);
    rerender(<CalendarMonthGrid initialMonth={initialMonth} numberOfMonths={3} />);
    expect(container.querySelectorAll('.CalendarMonth')).toHaveLength(5);
  });

  it('finishes an animation if the browser misses transitionend', () => {
    vi.useFakeTimers();
    const onMonthTransitionEnd = vi.fn();
    const gridRef = React.createRef();
    const { rerender } = render(
      <CalendarMonthGrid
        ref={gridRef}
        initialMonth={initialMonth}
        isAnimating={false}
        onMonthTransitionEnd={onMonthTransitionEnd}
        transitionDuration={200}
      />,
    );
    gridRef.current.isTransitionEndSupported = true;

    rerender(
      <CalendarMonthGrid
        ref={gridRef}
        initialMonth={initialMonth}
        isAnimating
        onMonthTransitionEnd={onMonthTransitionEnd}
        transitionDuration={200}
      />,
    );
    vi.advanceTimersByTime(349);
    expect(onMonthTransitionEnd).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onMonthTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('cancels the animation fallback after transitionend', () => {
    vi.useFakeTimers();
    const onMonthTransitionEnd = vi.fn();
    const gridRef = React.createRef();
    const { container, rerender } = render(
      <CalendarMonthGrid
        ref={gridRef}
        initialMonth={initialMonth}
        isAnimating={false}
        onMonthTransitionEnd={onMonthTransitionEnd}
        transitionDuration={200}
      />,
    );
    gridRef.current.isTransitionEndSupported = true;

    rerender(
      <CalendarMonthGrid
        ref={gridRef}
        initialMonth={initialMonth}
        isAnimating
        onMonthTransitionEnd={onMonthTransitionEnd}
        transitionDuration={200}
      />,
    );
    fireEvent.transitionEnd(container.querySelector('.CalendarMonthGrid'), {
      propertyName: 'transform',
    });
    vi.runAllTimers();
    expect(onMonthTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onMonthChange with the selected month from a vertical month element', () => {
    const onMonthChange = vi.fn();
    const renderMonthElement = ({ month, onMonthSelect }) => (
      <button
        type="button"
        data-testid="select-month"
        onClick={() => onMonthSelect(month, 5)}
      >
        select month
      </button>
    );
    render(
      <CalendarMonthGrid
        initialMonth={initialMonth}
        numberOfMonths={1}
        orientation={VERTICAL_SCROLLABLE}
        onMonthChange={onMonthChange}
        renderMonthElement={renderMonthElement}
      />,
    );
    fireEvent.click(screen.getByTestId('select-month'));
    expect(onMonthChange).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, month: 6, day: 1 }),
    );
  });

  it('calls onYearChange with the selected year from a vertical month element', () => {
    const onYearChange = vi.fn();
    const renderMonthElement = ({ month, onYearSelect }) => (
      <button
        type="button"
        data-testid="select-year"
        onClick={() => onYearSelect(month, 2030)}
      >
        select year
      </button>
    );
    render(
      <CalendarMonthGrid
        initialMonth={initialMonth}
        numberOfMonths={1}
        orientation={VERTICAL_SCROLLABLE}
        onYearChange={onYearChange}
        renderMonthElement={renderMonthElement}
      />,
    );
    fireEvent.click(screen.getByTestId('select-year'));
    expect(onYearChange).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2030, month: 2, day: 1 }),
    );
  });

  it('renders only requested months for vertical scrolling and marks visibility', () => {
    const { container } = render(
      <CalendarMonthGrid
        initialMonth={initialMonth}
        numberOfMonths={2}
        orientation={VERTICAL_SCROLLABLE}
        firstVisibleMonthIndex={1}
      />,
    );
    expect(container.querySelectorAll('.CalendarMonth')).toHaveLength(2);
    expect(container.querySelectorAll('[data-visible="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-visible="false"]')).toHaveLength(1);
  });
});
