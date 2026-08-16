import React from 'react';
import { DateTime } from 'luxon';
import {
  cleanup, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CustomizableCalendarDay from '../../../src/components/CustomizableCalendarDay.jsx';

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

describe('CustomizableCalendarDay legacy observable behavior', () => {
  it('renders single- and double-digit calendar dates', () => {
    renderDay(<CustomizableCalendarDay day={DateTime.fromISO('2024-02-01')} />);
    expect(getDayCell().textContent).toBe('1');

    cleanup();
    renderDay(<CustomizableCalendarDay day={DateTime.fromISO('2024-02-29')} />);
    expect(getDayCell().textContent).toBe('29');
  });

  it('renders custom day contents and forwards the DateTime and modifiers', () => {
    const modifiers = new Set(['blocked']);
    const renderDayContents = vi.fn((value, receivedModifiers) => (
      `${value.toFormat('cccc')} ${receivedModifiers.has('blocked') ? 'BLOCKED' : ''}`
    ));

    renderDay(
      <CustomizableCalendarDay
        day={day}
        modifiers={modifiers}
        renderDayContents={renderDayContents}
      />,
    );

    expect(getDayCell().textContent).toBe('Tuesday BLOCKED');
    expect(renderDayContents).toHaveBeenCalledWith(day, modifiers);
  });

  it('renders the button role and requested tab index', () => {
    renderDay(<CustomizableCalendarDay day={day} tabIndex={0} />);
    expect(getDayCell().getAttribute('role')).toBe('button');
    expect(getDayCell().tabIndex).toBe(0);
  });

  it.each([
    ['available', new Set(), 'available'],
    ['selected', new Set(['selected']), 'selected'],
    ['selected start', new Set(['blocked', 'selected-start']), 'selected-start'],
    ['selected end', new Set(['blocked', 'selected-end']), 'selected-end'],
    ['blocked', new Set(['blocked']), 'unavailable'],
  ])('uses the %s accessibility phrase', (_label, modifiers, expected) => {
    renderDay(
      <CustomizableCalendarDay day={day} modifiers={modifiers} phrases={phrases} />,
    );
    expect(getDayCell().getAttribute('aria-label')).toBe(expected);
  });

  it('supports a Luxon/Intl-compatible aria label formatter', () => {
    renderDay(
      <CustomizableCalendarDay
        day={day}
        ariaLabelFormat={() => 'custom aria label'}
        phrases={{ chooseAvailableDate: ({ date: formatted }) => formatted }}
      />,
    );
    expect(getDayCell().getAttribute('aria-label')).toBe('custom aria label');
  });

  it('applies custom base and hover styles', () => {
    const defaultStyles = {
      background: 'rgb(1, 2, 3)',
      border: '2px solid rgb(4, 5, 6)',
      color: 'rgb(7, 8, 9)',
      hover: {
        background: 'rgb(10, 11, 12)',
      },
    };
    renderDay(
      <CustomizableCalendarDay
        day={day}
        defaultStyles={defaultStyles}
      />,
    );
    const cell = getDayCell();
    expect(cell.style.background).toBe('rgb(1, 2, 3)');
    expect(cell.style.border).toBe('2px solid rgb(4, 5, 6)');
    expect(cell.style.color).toBe('rgb(7, 8, 9)');

    fireEvent.mouseEnter(cell);
    expect(cell.style.background).toBe('rgb(10, 11, 12)');
  });

  it('renders an empty table cell when day is null', () => {
    const { container } = renderDay(<CustomizableCalendarDay day={null} />);
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
      <CustomizableCalendarDay
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
    renderDay(<CustomizableCalendarDay day={day} onDayClick={onDayClick} />);
    fireEvent.keyDown(getDayCell(), { key });
    expect(onDayClick).toHaveBeenCalledWith(day, expect.any(Object));
  });

  it('does not call onDayClick for unrelated keys', () => {
    const onDayClick = vi.fn();
    renderDay(<CustomizableCalendarDay day={day} onDayClick={onDayClick} />);
    fireEvent.keyDown(getDayCell(), { key: 'Shift' });
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it('tracks hover state and returns to base styles on mouseleave', () => {
    const defaultStyles = {
      background: 'rgb(1, 2, 3)',
      hover: { background: 'rgb(10, 11, 12)' },
    };
    renderDay(<CustomizableCalendarDay day={day} defaultStyles={defaultStyles} />);
    const cell = getDayCell();

    fireEvent.mouseEnter(cell);
    expect(cell.style.background).toBe('rgb(10, 11, 12)');
    fireEvent.mouseLeave(cell);
    expect(cell.style.background).toBe('rgb(1, 2, 3)');
  });

  it('moves focus to a newly focusable day after the animation frame', async () => {
    const { rerender } = renderDay(
      <CustomizableCalendarDay day={day} tabIndex={-1} isFocused />,
    );
    rerender(
      <table>
        <tbody>
          <tr><CustomizableCalendarDay day={day} tabIndex={0} isFocused /></tr>
        </tbody>
      </table>,
    );

    await waitFor(() => expect(document.activeElement).toBe(getDayCell()));
  });
});
