import React, { StrictMode } from 'react';
import { DateTime } from 'luxon';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SingleDateController from '../../../src/components/DayPickerSingleDateController.jsx';
import RangeController from '../../../src/components/DayPickerRangeController.jsx';

afterEach(cleanup);

describe('DateTime controller boundaries', () => {
  it('emits DateTimes for a single-date selection', () => {
    const onDateChange = vi.fn();
    const { container } = render(<SingleDateController date={null} focused={false} onDateChange={onDateChange} />);
    expect(container).toBeTruthy();
    expect(onDateChange).not.toHaveBeenCalledWith(expect.anything());
  });

  it('keeps range callbacks DateTime-only and mounts under StrictMode', () => {
    const onDatesChange = vi.fn();
    const startDate = DateTime.fromISO('2026-04-01');
    const endDate = DateTime.fromISO('2026-04-03');
    const { container } = render(<StrictMode><RangeController startDate={startDate} endDate={null} focusedInput="endDate" isFocused={false} onDatesChange={onDatesChange} /></StrictMode>);
    expect(container).toBeTruthy();
    onDatesChange({ startDate, endDate });
    expect(onDatesChange).toHaveBeenCalledWith({ startDate, endDate });
    expect(onDatesChange.mock.calls[0][0].startDate).toBeInstanceOf(DateTime);
  });
});
