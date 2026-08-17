import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DayPickerRangeController from '../../../../src/components/DayPickerRangeController.jsx';
import { START_DATE, VERTICAL_SCROLLABLE } from '../../../../src/constants';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const month = DateTime.fromISO('2024-02-01').setLocale('en-US');
const date = (value) => DateTime.fromISO(value).setLocale('en-US');
const previousLabel = 'Move backward to switch to the previous month.';
const nextLabel = 'Move forward to switch to the next month.';

const baseProps = {
  focusedInput: START_DATE,
  numberOfMonths: 1,
  initialVisibleMonth: () => month,
  hideKeyboardShortcutsPanel: true,
  renderDayContents: (value) => (
    <span data-date={value.toISODate()}>{value.day}</span>
  ),
};

function renderController(props = {}) {
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
  Object.defineProperty(navigator, 'msMaxTouchPoints', { configurable: true, value: 0 });
  delete window.ontouchstart;
  return render(<DayPickerRangeController {...baseProps} {...props} />);
}

function finishMonthTransition() {
  fireEvent.transitionEnd(document.querySelector('.CalendarMonthGrid'));
}

describe('DayPickerRangeController navigation and forwarding', () => {
  it('calls the previous-month callback with a Luxon month', () => {
    const onPrevMonthClick = vi.fn();
    renderController({ onPrevMonthClick });
    fireEvent.click(screen.getByRole('button', { name: previousLabel }));
    finishMonthTransition();
    expect(onPrevMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, month: 1, day: 1 }),
    );
  });

  it('calls the next-month callback with a Luxon month', () => {
    const onNextMonthClick = vi.fn();
    renderController({ onNextMonthClick });
    fireEvent.click(screen.getByRole('button', { name: nextLabel }));
    finishMonthTransition();
    expect(onNextMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, month: 3, day: 1 }),
    );
  });

  it('disables previous and next navigation at visible min/max limits', () => {
    renderController({ minDate: date('2024-02-10') });
    expect(screen.getByRole('button', { name: previousLabel }).getAttribute('aria-disabled'))
      .toBe('true');
    expect(screen.getByRole('button', { name: nextLabel }).getAttribute('aria-disabled'))
      .toBeNull();

    cleanup();
    render(
      <DayPickerRangeController
        {...baseProps}
        maxDate={date('2024-02-20')}
      />,
    );
    expect(screen.getByRole('button', { name: previousLabel }).getAttribute('aria-disabled'))
      .toBeNull();
    expect(screen.getByRole('button', { name: nextLabel }).getAttribute('aria-disabled'))
      .toBe('true');
  });

  it('does not invoke a disabled navigation callback', () => {
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    renderController({
      minDate: date('2024-02-10'),
      maxDate: date('2024-02-20'),
      onPrevMonthClick,
      onNextMonthClick,
    });
    fireEvent.click(screen.getByRole('button', { name: previousLabel }));
    fireEvent.click(screen.getByRole('button', { name: nextLabel }));
    expect(onPrevMonthClick).not.toHaveBeenCalled();
    expect(onNextMonthClick).not.toHaveBeenCalled();
  });

  it('loads additional months in vertical-scrollable mode', () => {
    renderController({
      orientation: VERTICAL_SCROLLABLE,
    });
    expect(document.querySelectorAll('.CalendarMonth')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: nextLabel }));
    expect(document.querySelectorAll('.CalendarMonth')).toHaveLength(2);
  });

  it('loads previous months in vertical-scrollable mode', () => {
    renderController({
      orientation: VERTICAL_SCROLLABLE,
    });
    fireEvent.click(screen.getByRole('button', { name: previousLabel }));
    expect(document.querySelectorAll('.CalendarMonth')).toHaveLength(2);
  });

  it('forwards custom month and week-header renderers', () => {
    const renderMonthText = vi.fn((value) => `month:${value.toFormat('yyyy-MM')}`);
    const renderWeekHeaderElement = vi.fn((value) => (
      <span data-weekday={value}>{value}</span>
    ));
    renderController({ renderMonthText, renderWeekHeaderElement });

    expect(renderMonthText).toHaveBeenCalled();
    expect(screen.getAllByText('month:2024-02').length).toBeGreaterThan(0);
    expect(renderWeekHeaderElement).toHaveBeenCalled();
    expect(document.querySelectorAll('[data-weekday]')).toHaveLength(7);
  });

  it('forwards custom navigation button props and handlers', () => {
    const onNextMonthClick = vi.fn();
    const renderNavNextButton = vi.fn(({ ariaLabel, disabled, onClick }) => (
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
      >
        custom next
      </button>
    ));
    renderController({ renderNavNextButton, onNextMonthClick });

    const button = screen.getByRole('button', { name: nextLabel });
    expect(renderNavNextButton).toHaveBeenCalledWith(expect.objectContaining({
      ariaLabel: nextLabel,
      disabled: false,
      onClick: expect.any(Function),
    }));
    fireEvent.click(button);
    finishMonthTransition();
    expect(onNextMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, month: 3 }),
    );
  });

  it('finds the first unblocked focusable day in the visible month', () => {
    const ref = React.createRef();
    render(
      <DayPickerRangeController
        ref={ref}
        {...baseProps}
        isDayBlocked={(value) => value.day <= 3}
      />,
    );
    const focused = ref.current.getFirstFocusableDay(month);
    expect(focused.toISODate()).toBe('2024-02-04');
  });
});
