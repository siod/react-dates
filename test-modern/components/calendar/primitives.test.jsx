import React from 'react';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CalendarDay from '../../../src/components/CalendarDay.jsx';
import CalendarMonth from '../../../src/components/CalendarMonth.jsx';
import CalendarMonthGrid from '../../../src/components/CalendarMonthGrid.jsx';

describe('modern calendar primitives', () => {
  it('renders Luxon DateTimes and modifier classes', () => {
    render(
      <table>
        <tbody>
          <tr>
            <CalendarDay day={DateTime.fromISO('2024-02-29')} modifiers={new Set(['selected', 'blocked'])} />
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByRole('button').textContent).toBe('29');
    expect(screen.getByRole('button').className).toContain('CalendarDay__selected');
  });

  it('projects calendar month weeks using DateTimes', () => {
    const { container } = render(<CalendarMonth month={DateTime.fromISO('2024-02-01')} enableOutsideDays />);
    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(29);
  });

  it('keeps month-grid navigation values as DateTimes', () => {
    const { container } = render(<CalendarMonthGrid initialMonth={DateTime.fromISO('2024-02-01')} numberOfMonths={1} />);
    expect(container.querySelectorAll('.CalendarMonth').length).toBe(3);
  });
});
