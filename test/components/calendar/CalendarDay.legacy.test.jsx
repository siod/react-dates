import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CalendarDay from '../../../src/components/CalendarDay.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const day = DateTime.fromISO('2017-10-10').setLocale('en-US');

function renderDay(ui) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>,
  );
}

function getDayCell() {
  return screen.getByRole('button');
}

const phrases = {
  chooseAvailableDate: () => 'available',
  dateIsSelected: () => 'selected',
  dateIsUnavailable: () => 'unavailable',
  dateIsSelectedAsStartDate: () => 'selected-start',
  dateIsSelectedAsEndDate: () => 'selected-end',
};

describe('CalendarDay legacy observable behavior', () => {
  it('renders single- and double-digit calendar dates', () => {
    renderDay(<CalendarDay day={DateTime.fromISO('2024-02-01')} />);
    expect(getDayCell().textContent).toBe('1');

    cleanup();
    renderDay(<CalendarDay day={DateTime.fromISO('2024-02-29')} />);
    expect(getDayCell().textContent).toBe('29');
  });

  it('renders custom day contents and forwards the DateTime and modifiers', () => {
    const modifiers = new Set(['blocked']);
    const renderDayContents = vi.fn((value, receivedModifiers) => (
      `${value.toFormat('cccc')} ${receivedModifiers.has('blocked') ? 'BLOCKED' : ''}`
    ));

    renderDay(<CalendarDay day={day} modifiers={modifiers} renderDayContents={renderDayContents} />);

    expect(getDayCell().textContent).toBe('Tuesday BLOCKED');
    expect(renderDayContents).toHaveBeenCalledWith(day, modifiers);
  });

  it('renders the button role and requested tab index', () => {
    renderDay(<CalendarDay day={day} tabIndex={0} />);
    expect(getDayCell().getAttribute('role')).toBe('button');
    expect(getDayCell().tabIndex).toBe(0);
  });

  it('marks today with aria-current and leaves other days unmarked', () => {
    renderDay(<CalendarDay day={day} modifiers={new Set(['today'])} />);
    expect(getDayCell().getAttribute('aria-current')).toBe('date');

    cleanup();
    renderDay(<CalendarDay day={day} />);
    expect(getDayCell().getAttribute('aria-current')).toBeNull();
  });

  it.each([
    ['available', new Set(), 'available'],
    ['selected', new Set(['selected']), 'selected'],
    ['selected span', new Set(['selected-span']), 'selected'],
    ['selected start', new Set(['blocked', 'selected-start']), 'selected-start'],
    ['selected end', new Set(['blocked', 'selected-end']), 'selected-end'],
    ['blocked', new Set(['blocked']), 'unavailable'],
  ])('uses the %s accessibility phrase', (_label, modifiers, expected) => {
    renderDay(<CalendarDay day={day} modifiers={modifiers} phrases={phrases} />);
    expect(getDayCell().getAttribute('aria-label')).toBe(expected);
  });

  it('supports a Luxon/Intl-compatible aria label formatter', () => {
    renderDay(
      <CalendarDay
        day={day}
        ariaLabelFormat={() => 'custom aria label'}
        phrases={{ chooseAvailableDate: ({ date: formatted }) => formatted }}
      />,
    );
    expect(getDayCell().getAttribute('aria-label')).toBe('custom aria label');

    cleanup();
    renderDay(
      <CalendarDay
        day={day}
        modifiers={new Set(['selected'])}
        ariaLabelFormat={() => 'custom aria label'}
        phrases={{ dateIsSelected: ({ date: formatted }) => formatted }}
      />,
    );
    expect(getDayCell().getAttribute('aria-label')).toBe('custom aria label');
  });

  it('exposes modifier classes and blocked accessibility state', () => {
    const modifiers = new Set([
      'blocked',
      'blocked-calendar',
      'blocked-minimum-nights',
      'blocked-out-of-range',
      'highlighted-calendar',
      'hovered-span',
      'selected-span',
      'selected-start',
      'selected-end',
      'today',
      'first-day-of-week',
      'last-day-of-week',
    ]);
    const { container } = renderDay(
      <CalendarDay day={day} modifiers={modifiers} isOutsideDay tabIndex={-1} />,
    );
    const className = container.querySelector('[role="button"]').className;

    [
      'CalendarDay__outside',
      'CalendarDay__today',
      'CalendarDay__firstDayOfWeek',
      'CalendarDay__lastDayOfWeek',
      'CalendarDay__highlighted_calendar',
      'CalendarDay__blocked_minimum_nights',
      'CalendarDay__blocked_calendar',
      'CalendarDay__selected_span',
      'CalendarDay__selected_start',
      'CalendarDay__selected_end',
      'CalendarDay__blocked_out_of_range',
    ].forEach((classToken) => expect(className).toContain(classToken));
    expect(getDayCell().getAttribute('aria-disabled')).toBe('true');

    cleanup();
    const hovered = renderDay(
      <CalendarDay day={day} modifiers={new Set(['hovered-span'])} />,
    ).container.querySelector('[role="button"]');
    expect(hovered.className).toContain('CalendarDay__hovered_span');
  });

  it('renders an empty table cell when day is null', () => {
    const { container } = renderDay(<CalendarDay day={null} />);
    const cell = container.querySelector('td');
    expect(cell).not.toBeNull();
    expect(cell.children).toHaveLength(0);
    expect(cell.attributes).toHaveLength(0);
  });

  it('blurs on mouseup and forwards click, hover, and leave callbacks', () => {
    const onDayClick = vi.fn();
    const onDayMouseEnter = vi.fn();
    const onDayMouseLeave = vi.fn();
    renderDay(
      <CalendarDay
        day={day}
        onDayClick={onDayClick}
        onDayMouseEnter={onDayMouseEnter}
        onDayMouseLeave={onDayMouseLeave}
      />,
    );
    const cell = getDayCell();
    cell.blur = vi.fn();

    fireEvent.mouseUp(cell);
    fireEvent.click(cell);
    fireEvent.mouseEnter(cell);
    fireEvent.mouseLeave(cell);

    expect(cell.blur).toHaveBeenCalledTimes(1);
    expect(onDayClick).toHaveBeenCalledWith(day, expect.any(Object));
    expect(onDayMouseEnter).toHaveBeenCalledWith(day, expect.any(Object));
    expect(onDayMouseLeave).toHaveBeenCalledWith(day, expect.any(Object));
  });

  it.each(['Enter', ' '])('calls onDayClick for the %s key', (key) => {
    const onDayClick = vi.fn();
    renderDay(<CalendarDay day={day} onDayClick={onDayClick} />);
    fireEvent.keyDown(getDayCell(), { key });
    expect(onDayClick).toHaveBeenCalledWith(day, expect.any(Object));
  });

  it('does not call onDayClick for unrelated keys', () => {
    const onDayClick = vi.fn();
    renderDay(<CalendarDay day={day} onDayClick={onDayClick} />);
    fireEvent.keyDown(getDayCell(), { key: 'Shift' });
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it('moves focus to a newly focusable day after the animation frame', async () => {
    const { rerender } = renderDay(<CalendarDay day={day} tabIndex={-1} isFocused />);
    rerender(
      <table>
        <tbody>
          <tr><CalendarDay day={day} tabIndex={0} isFocused /></tr>
        </tbody>
      </table>,
    );

    await waitFor(() => expect(document.activeElement).toBe(getDayCell()));
  });
});
