import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, screen,
} from '@testing-library/react';
import {
  afterEach, describe, expect, it, vi,
} from 'vitest';

import DateRangePicker from '../../../src/components/DateRangePicker.jsx';
import SingleDatePicker from '../../../src/components/SingleDatePicker.jsx';
import {
  ANCHOR_RIGHT, END_DATE, OPEN_UP, START_DATE,
} from '../../../src/constants.js';
import { renderStrict } from '../../helpers/index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const initialMonth = DateTime.fromISO('2099-02-01', { zone: 'UTC' });

function singleProps(overrides = {}) {
  return {
    date: null,
    focused: true,
    id: 'single-date',
    initialVisibleMonth: () => initialMonth,
    isOutsideRange: () => false,
    numberOfMonths: 1,
    onClose: vi.fn(),
    onDateChange: vi.fn(),
    onFocusChange: vi.fn(),
    transitionDuration: 0,
    ...overrides,
  };
}

function rangeProps(overrides = {}) {
  return {
    endDate: null,
    endDateId: 'end-date',
    focusedInput: START_DATE,
    initialVisibleMonth: () => initialMonth,
    isOutsideRange: () => false,
    dayAriaLabelFormat: (day) => day.toISODate(),
    numberOfMonths: 1,
    onClose: vi.fn(),
    onDatesChange: vi.fn(),
    onFocusChange: vi.fn(),
    startDate: null,
    startDateId: 'start-date',
    transitionDuration: 0,
    ...overrides,
  };
}

function visibleDay(day) {
  return Array.from(document.querySelectorAll(
    '.CalendarMonth[data-visible="true"] .CalendarDay[role="button"]',
  )).find((element) => element.getAttribute('aria-label')?.endsWith(day));
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

describe('single picker shell callback and focus branches', () => {
  it('forwards previous and next navigation callbacks with the changed month', async () => {
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    renderStrict(<SingleDatePicker {...singleProps({ onNextMonthClick, onPrevMonthClick })} />);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    await vi.waitFor(() => expect(onNextMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2099, month: 3, day: 1 }),
    ));

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    await vi.waitFor(() => expect(onPrevMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2099, month: 2, day: 1 }),
    ));
  });

  it('opens and closes keyboard shortcuts without closing the date picker', async () => {
    const onClose = vi.fn();
    const restorePointer = forceDesktopPointer();
    const input = renderStrict(<SingleDatePicker {...singleProps({ onClose })} />)
      .getByRole('textbox');

    fireEvent.change(input, { target: { value: '?' } });
    await vi.waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    restorePointer();
  });

  it('distinguishes focus leaving the calendar from focus moving inside it', () => {
    const onClose = vi.fn();
    const onFocusChange = vi.fn();
    const { container } = renderStrict(
      <SingleDatePicker {...singleProps({ onClose, onFocusChange })} />,
    );
    const picker = container.querySelector('.SingleDatePicker_picker');
    const day = visibleDay('2099-02-14');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    onFocusChange.mockClear();

    fireEvent.focusOut(picker, { relatedTarget: day });
    expect(onFocusChange).not.toHaveBeenCalled();

    fireEvent.focusOut(picker, { relatedTarget: outside });
    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).not.toHaveBeenCalled();
    outside.remove();
  });

  it('closes through calendar Escape with the selected Luxon date', () => {
    const date = DateTime.fromISO('2099-02-14', { zone: 'UTC' });
    const onClose = vi.fn();
    const onFocusChange = vi.fn();
    renderStrict(<SingleDatePicker {...singleProps({ date, onClose, onFocusChange })} />);

    fireEvent.keyDown(screen.getByRole('application', { name: 'Calendar' }), { key: 'Escape' });

    expect(onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(onClose).toHaveBeenCalledWith({ date });
  });

  it('positions an open-up, right-anchored picker and renders its portal branch', () => {
    const { container, rerender } = renderStrict(
      <SingleDatePicker {...singleProps({ anchorDirection: ANCHOR_RIGHT, openDirection: OPEN_UP })} />,
    );
    const picker = container.querySelector('.SingleDatePicker_picker');
    expect(picker.style.bottom).not.toBe('');
    expect(picker.style.right).not.toBe('');

    rerender(
      <SingleDatePicker {...singleProps({ withPortal: true })} />,
    );
    expect(document.body.querySelector('.SingleDatePicker_picker__portal')).toBeTruthy();
  });
});

describe('range picker shell callback and focus branches', () => {
  it('forwards previous and next navigation callbacks with the changed month', async () => {
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    renderStrict(<DateRangePicker {...rangeProps({ onNextMonthClick, onPrevMonthClick })} />);

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    await vi.waitFor(() => expect(onNextMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2099, month: 3, day: 1 }),
    ));

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    await vi.waitFor(() => expect(onPrevMonthClick).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2099, month: 2, day: 1 }),
    ));
  });

  it('opens and closes keyboard shortcuts from either range input', async () => {
    const restorePointer = forceDesktopPointer();
    renderStrict(<DateRangePicker {...rangeProps()} />);
    const input = screen.getAllByRole('textbox')[0];

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '?' } });
    await vi.waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(input).toBeTruthy();
    restorePointer();
  });

  it('keeps focus inside the day picker and closes on focus leaving it', () => {
    const startDate = DateTime.fromISO('2099-02-10', { zone: 'UTC' });
    const onClose = vi.fn();
    const onFocusChange = vi.fn();
    const { container } = renderStrict(
      <DateRangePicker {...rangeProps({ startDate, onClose, onFocusChange })} />,
    );
    const picker = container.querySelector('.DateRangePicker_picker');
    const day = visibleDay('2099-02-14');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    onFocusChange.mockClear();

    fireEvent.focusOut(picker, { relatedTarget: day });
    expect(onFocusChange).not.toHaveBeenCalled();

    fireEvent.focusOut(picker, { relatedTarget: outside });
    expect(onFocusChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledWith({ startDate, endDate: null });
    outside.remove();
  });

  it('moves an unfocused range to the start date from ArrowDown', () => {
    const onFocusChange = vi.fn();
    renderStrict(<DateRangePicker {...rangeProps({ focusedInput: null, onFocusChange })} />);

    fireEvent.keyDown(screen.getAllByRole('textbox')[0], { key: 'ArrowDown' });

    expect(onFocusChange).toHaveBeenCalledWith(START_DATE);
  });

  it('uses the end-date focus callback when the end input is selected', () => {
    const onFocusChange = vi.fn();
    renderStrict(<DateRangePicker {...rangeProps({ focusedInput: null, onFocusChange })} />);

    fireEvent.focus(screen.getAllByRole('textbox')[1]);

    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
  });

  it('keeps DOM focus in the calendar after selecting a range start', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    const { container } = renderStrict(
      <DateRangePicker {...rangeProps({ onDatesChange, onFocusChange })} />,
    );
    const day = visibleDay('2099-02-14');
    day.focus();

    fireEvent.click(day);

    expect(document.activeElement).toBe(day);
    expect(onDatesChange).toHaveBeenCalledWith({
      startDate: expect.any(DateTime),
      endDate: null,
    });
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);
    expect(container.querySelector('.DayPicker')).toBeTruthy();
  });

});
