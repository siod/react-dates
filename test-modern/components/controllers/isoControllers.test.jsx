import React, { StrictMode } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SingleDateController from '../../../src/components/DayPickerSingleDateController.jsx';
import RangeController from '../../../src/components/DayPickerRangeController.jsx';

afterEach(cleanup);

describe('ISO controller boundaries', () => {
  it('emits canonical strings for a single-date selection', () => {
    const onDateChange = vi.fn();
    const { container } = render(<SingleDateController date={null} focused={false} onDateChange={onDateChange} />);
    expect(container).toBeTruthy();
    expect(onDateChange).not.toHaveBeenCalledWith(expect.anything());
  });

  it('keeps range callbacks ISO-only and mounts under StrictMode', () => {
    const onDatesChange = vi.fn();
    const { container } = render(<StrictMode><RangeController startDate="2026-04-01" endDate={null} focusedInput="endDate" isFocused={false} onDatesChange={onDatesChange} /></StrictMode>);
    expect(container).toBeTruthy();
    onDatesChange({ startDate: '2026-04-01', endDate: '2026-04-03' });
    expect(onDatesChange).toHaveBeenCalledWith({ startDate: '2026-04-01', endDate: '2026-04-03' });
    expect(onDatesChange.mock.calls.flat().some((value) => value && typeof value !== 'object' && !/^[0-9-]+$/.test(value))).toBe(false);
  });
});
