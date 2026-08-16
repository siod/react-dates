import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CalendarDay from '../../../src/components/CalendarDay.jsx';
import CalendarMonth from '../../../src/components/CalendarMonth.jsx';
import CalendarMonthGrid from '../../../src/components/CalendarMonthGrid.jsx';

describe('modern calendar primitives', () => {
  it('renders ISO day values and modifier classes without date objects', () => {
    render(<CalendarDay day="2024-02-29" modifiers={new Set(['selected', 'blocked'])} />);
    expect(screen.getByRole('button').textContent).toBe('29');
    expect(screen.getByRole('button').className).toContain('CalendarDay__selected');
  });

  it('projects calendar month weeks using ISO values', () => {
    const { container } = render(<CalendarMonth month="2024-02-01" enableOutsideDays />);
    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(29);
  });

  it('keeps month-grid navigation values canonical', () => {
    const { container } = render(<CalendarMonthGrid initialMonth="2024-02-01" numberOfMonths={1} />);
    expect(container.querySelectorAll('.CalendarMonth').length).toBe(3);
  });
});
