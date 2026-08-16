import React from 'react';
import { DateTime } from 'luxon';
import {
  act, cleanup, fireEvent, render,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DayPickerRangeController from '../../../../src/components/DayPickerRangeController.jsx';
import CalendarDay from '../../../../src/components/CalendarDay.jsx';
import { END_DATE, START_DATE } from '../../../../src/constants';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const month = DateTime.fromISO('2024-02-01').setLocale('en-US');
const date = (value) => DateTime.fromISO(value).setLocale('en-US');

const baseProps = {
  focusedInput: START_DATE,
  numberOfMonths: 1,
  initialVisibleMonth: () => month,
  hideKeyboardShortcutsPanel: true,
  renderDayContents: (value, modifiers) => (
    <span
      data-date={value.toISODate()}
      data-modifiers={[...modifiers].sort().join('|')}
    >
      {value.day}
    </span>
  ),
};

function renderController(props = {}) {
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
  Object.defineProperty(navigator, 'msMaxTouchPoints', { configurable: true, value: 0 });
  delete window.ontouchstart;
  return render(<DayPickerRangeController {...baseProps} {...props} />);
}

function marker(value) {
  return document.querySelector(`[data-date="${value.toISODate()}"]`);
}

function cell(value) {
  return marker(value)?.closest('[role="button"]');
}

function modifiers(value) {
  const valueString = marker(value)?.getAttribute('data-modifiers') || '';
  return new Set(valueString ? valueString.split('|') : []);
}

describe('DayPickerRangeController range modifiers', () => {
  it('renders valid, blocked, out-of-range, highlighted, and selected modifiers', () => {
    renderController({
      startDate: date('2024-02-10'),
      endDate: date('2024-02-18'),
      isDayBlocked: (value) => value.day === 12,
      isOutsideRange: (value) => value.day === 13,
      isDayHighlighted: (value) => value.day === 14,
    });

    expect(modifiers(date('2024-02-09'))).toContain('valid');
    expect(modifiers(date('2024-02-10'))).toContain('selected-start');
    expect(modifiers(date('2024-02-11'))).toContain('selected-span');
    expect([...modifiers(date('2024-02-12'))]).toEqual(expect.arrayContaining([
      'blocked', 'blocked-calendar',
    ]));
    expect([...modifiers(date('2024-02-13'))]).toEqual(expect.arrayContaining([
      'blocked', 'blocked-out-of-range',
    ]));
    expect(modifiers(date('2024-02-14'))).toContain('highlighted-calendar');
    expect(modifiers(date('2024-02-18'))).toContain('selected-end');
    expect(cell(date('2024-02-12')).getAttribute('aria-disabled')).toBe('true');
  });

  it('does not select a blocked day through the public day click', () => {
    const onDatesChange = vi.fn();
    const onFocusChange = vi.fn();
    renderController({
      onDatesChange,
      onFocusChange,
      isDayBlocked: (value) => value.day === 12,
    });

    act(() => fireEvent.click(cell(date('2024-02-12'))));
    expect(onDatesChange).not.toHaveBeenCalled();
    expect(onFocusChange).not.toHaveBeenCalled();
  });

  it('marks today and keeps first and last weekday modifiers locale-aware', () => {
    const today = DateTime.local().setLocale('en-US');
    renderController({
      initialVisibleMonth: () => today.startOf('month'),
      firstDayOfWeek: 1,
    });

    expect(modifiers(today)).toContain('today');
    expect(modifiers(today.startOf('month'))).not.toContain('first-day-of-week');

    const monday = today.startOf('month').startOf('week');
    const firstMonday = monday.weekday === 1 ? monday : monday.plus({ days: 7 });
    const sunday = firstMonday.plus({ days: 6 });
    expect(modifiers(firstMonday)).toContain('first-day-of-week');
    expect(modifiers(sunday)).toContain('last-day-of-week');
  });

  it('forwards custom calendar-day rendering with the DateTime modifiers', () => {
    const renderCalendarDay = vi.fn(({ day, modifiers: receivedModifiers, tabIndex }) => (
      <CalendarDay
        day={day}
        modifiers={receivedModifiers}
        tabIndex={tabIndex}
        renderDayContents={(value) => (
          <span data-custom-date={value.toISODate()}>{value.day}</span>
        )}
      />
    ));
    renderController({
      renderCalendarDay,
      isDayBlocked: (value) => value.day === 12,
    });

    const blockedCall = renderCalendarDay.mock.calls
      .find(([props]) => props.day?.toISODate() === '2024-02-12');
    expect(blockedCall).toBeDefined();
    expect(blockedCall[0].day.toISODate()).toBe('2024-02-12');
    expect(blockedCall[0].modifiers).toContain('blocked');
    expect(document.querySelector('[data-custom-date="2024-02-12"]')).not.toBeNull();
  });

  it('adds hovered and hovered-span modifiers for an end-date preview', () => {
    const startDate = date('2024-02-10');
    renderController({
      startDate,
      focusedInput: END_DATE,
    });

    act(() => fireEvent.mouseEnter(cell(date('2024-02-13'))));

    expect([...modifiers(date('2024-02-13'))]).toEqual(expect.arrayContaining([
      'hovered', 'hovered-span', 'after-hovered-start',
    ]));
    expect(modifiers(date('2024-02-11'))).toContain('hovered-span');
    expect(modifiers(date('2024-02-11'))).toContain('after-hovered-start');
    expect(modifiers(date('2024-02-09'))).not.toContain('hovered-span');
  });

  it('adds hovered and before-hovered-end modifiers for a start-date preview', () => {
    const endDate = date('2024-02-18');
    renderController({
      endDate,
      focusedInput: START_DATE,
    });

    act(() => fireEvent.mouseEnter(cell(date('2024-02-13'))));

    expect([...modifiers(date('2024-02-13'))]).toEqual(expect.arrayContaining([
      'hovered', 'hovered-span', 'before-hovered-end',
    ]));
    expect(modifiers(date('2024-02-17'))).toContain('before-hovered-end');
    expect(modifiers(date('2024-02-12'))).not.toContain('hovered-span');
  });

  it('moves hover modifiers to the new preview day and clears them on leave', () => {
    renderController({
      startDate: date('2024-02-10'),
      focusedInput: END_DATE,
    });
    const first = cell(date('2024-02-12'));
    const second = cell(date('2024-02-15'));

    act(() => fireEvent.mouseEnter(first));
    expect(modifiers(date('2024-02-12'))).toContain('hovered');
    act(() => fireEvent.mouseEnter(second));
    expect(modifiers(date('2024-02-12'))).not.toContain('hovered');
    expect(modifiers(date('2024-02-15'))).toContain('hovered');

    act(() => fireEvent.mouseLeave(second, { relatedTarget: document.body }));
    expect([...modifiers(date('2024-02-12'))].some((name) => name.includes('hovered'))).toBe(false);
    expect([...modifiers(date('2024-02-15'))].some((name) => name.includes('hovered'))).toBe(false);
  });

  it('suppresses hover changes on touch devices', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 1,
    });
    const ref = React.createRef();
    render(<DayPickerRangeController ref={ref} {...baseProps} />);

    act(() => fireEvent.mouseEnter(cell(date('2024-02-12'))));
    expect(ref.current.state.hoverDate).toBeNull();
    expect(modifiers(date('2024-02-12'))).not.toContain('hovered');
  });

  it('previews offset dates through the legacy endDateOffset contract', () => {
    const ref = React.createRef();
    const hoverDate = date('2024-02-10');
    renderController({
      ref,
      endDateOffset: (value) => value.plus({ days: 2 }),
    });

    act(() => ref.current.onDayMouseEnter(hoverDate));
    expect(ref.current.state.dateOffset.start.toISODate()).toBe('2024-02-10');
    expect(ref.current.state.dateOffset.end.toISODate()).toBe('2024-02-13');
  });

  it('marks the first possible and blocked minimum-night hover range', () => {
    const hoverDate = date('2024-02-10');
    renderController({
      focusedInput: START_DATE,
      minimumNights: 2,
      getMinNightsForHoverDate: () => 2,
    });

    act(() => fireEvent.mouseEnter(cell(hoverDate)));
    expect(modifiers(date('2024-02-12'))).toContain('hovered-start-first-possible-end');
    expect(modifiers(date('2024-02-11')))
      .toContain('hovered-start-blocked-minimum-nights');
  });

  it('keeps the selected end marked as last-in-range', () => {
    renderController({
      startDate: date('2024-02-10'),
      endDate: date('2024-02-18'),
    });
    expect(modifiers(date('2024-02-18'))).toContain('last-in-range');
  });
});
