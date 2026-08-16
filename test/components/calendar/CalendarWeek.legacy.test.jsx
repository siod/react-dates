import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CalendarWeek from '../../../src/components/CalendarWeek.jsx';

describe('CalendarWeek legacy observable behavior', () => {
  it('renders a table row containing its children', () => {
    const { container } = render(
      <table>
        <tbody>
          <CalendarWeek>
            <td data-testid="day">10</td>
          </CalendarWeek>
        </tbody>
      </table>,
    );

    expect(container.querySelector('tr')).not.toBeNull();
    expect(container.querySelector('tr [data-testid="day"]').textContent).toBe('10');
  });
});
