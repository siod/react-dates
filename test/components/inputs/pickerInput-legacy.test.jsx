import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DateRangePickerInput from '../../../src/components/DateRangePickerInput.jsx';
import SingleDatePickerInput from '../../../src/components/SingleDatePickerInput.jsx';
import { END_DATE, START_DATE } from '../../../src/constants';

afterEach(cleanup);

function rangeInput(overrides = {}, children = null) {
  return render(
    <DateRangePickerInput
      startDateId="start-date"
      endDateId="end-date"
      {...overrides}
    >
      {children}
    </DateRangePickerInput>,
  );
}

function singleInput(overrides = {}, children = null) {
  return render(
    <SingleDatePickerInput id="date" {...overrides}>
      {children}
    </SingleDatePickerInput>,
  );
}

describe('DateRangePickerInput observable legacy behavior', () => {
  it('renders two accessible date inputs with screen-reader instructions', () => {
    rangeInput();
    const inputs = screen.getAllByRole('textbox');

    expect(inputs).toHaveLength(2);
    expect(inputs[0].getAttribute('aria-label')).toBe('Start Date');
    expect(inputs[1].getAttribute('aria-label')).toBe('End Date');
    expect(screen.getByText(/Navigate forward to interact with the calendar/)).toBeTruthy();
    expect(screen.getByText(/Navigate backward to interact with the calendar/)).toBeTruthy();
  });

  it('renders clear dates, calendar, custom arrow, and custom close controls', () => {
    const onClearDates = vi.fn();
    const onKeyDownArrowDown = vi.fn();
    rangeInput({
      startDate: '07/13/1991',
      showClearDates: true,
      showDefaultInputIcon: true,
      onClearDates,
      onKeyDownArrowDown,
      customArrowIcon: <span data-testid="custom-range-arrow">arrow</span>,
      customCloseIcon: <span data-testid="custom-range-close">close</span>,
    });

    expect(screen.getByTestId('custom-range-arrow')).toBeTruthy();
    expect(screen.getByTestId('custom-range-close')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Dates' }));
    fireEvent.click(screen.getByRole('button', {
      name: 'Interact with the calendar and add the check-in date for your trip.',
    }));

    expect(onClearDates).toHaveBeenCalledTimes(1);
    expect(onKeyDownArrowDown).toHaveBeenCalledTimes(1);
  });

  it('renders no calendar control unless requested and renders the small arrow form', () => {
    rangeInput({ small: true });

    expect(screen.queryByRole('button', {
      name: 'Interact with the calendar and add the check-in date for your trip.',
    })).toBeNull();
    expect(screen.getByText('-')).toBeTruthy();
  });

  it.each([
    [START_DATE, true, false],
    [END_DATE, false, true],
    [true, true, true],
    [false, false, false],
  ])('applies disabled=%s independently to the start and end input',
    (disabled, startDisabled, endDisabled) => {
      rangeInput({ disabled });
      const [start, end] = screen.getAllByRole('textbox');

      expect(start.disabled).toBe(startDisabled);
      expect(end.disabled).toBe(endDisabled);
    });

  it('places children next to the currently focused range input', () => {
    const child = <span data-testid="range-child">custom child</span>;
    const { rerender } = rangeInput({ isEndDateFocused: false }, child);
    expect(screen.getByTestId('range-child')).toBeTruthy();

    rerender(
      <DateRangePickerInput startDateId="start-date" endDateId="end-date" isEndDateFocused>
        {child}
      </DateRangePickerInput>,
    );
    expect(screen.getByTestId('range-child')).toBeTruthy();
  });

  it('passes focus and typed-date events from each input to its callbacks', () => {
    const callbacks = {
      onStartDateFocus: vi.fn(),
      onEndDateFocus: vi.fn(),
      onStartDateChange: vi.fn(),
      onEndDateChange: vi.fn(),
    };
    rangeInput(callbacks);
    const [start, end] = screen.getAllByRole('textbox');

    fireEvent.focus(start);
    fireEvent.change(start, { target: { value: '07/13/1991' } });
    fireEvent.focus(end);
    fireEvent.change(end, { target: { value: '07/14/1991' } });

    expect(callbacks.onStartDateFocus).toHaveBeenCalledTimes(1);
    expect(callbacks.onEndDateFocus).toHaveBeenCalledTimes(1);
    expect(callbacks.onStartDateChange).toHaveBeenCalledWith('07/13/1991');
    expect(callbacks.onEndDateChange).toHaveBeenCalledWith('07/14/1991');
  });

  it('uses a custom screen-reader message for both fields', () => {
    rangeInput({ screenReaderMessage: 'Enter a trip date.' });

    expect(screen.getAllByText('Enter a trip date.')).toHaveLength(2);
    expect(screen.getAllByRole('textbox')[0].getAttribute('aria-describedby')).toBe(
      'DateInput__screen-reader-message-start-date',
    );
  });
});

describe('SingleDatePickerInput observable legacy behavior', () => {
  it('renders children and preserves the input accessibility contract', () => {
    singleInput(
      { placeholder: 'Pick a date', ariaLabel: 'Travel date' },
      <span data-testid="single-child">custom child</span>,
    );
    const input = screen.getByRole('textbox', { name: 'Travel date' });

    expect(input.getAttribute('placeholder')).toBe('Pick a date');
    expect(screen.getByTestId('single-child')).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toBe(
      'DateInput__screen-reader-message-date',
    );
  });

  it('renders and invokes the clear date control', () => {
    const onClearDate = vi.fn();
    singleInput({
      displayValue: '07/13/1991',
      showClearDate: true,
      onClearDate,
      customCloseIcon: <span data-testid="custom-single-close">close</span>,
    });

    expect(screen.getByTestId('custom-single-close')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Date' }));
    expect(onClearDate).toHaveBeenCalledTimes(1);
  });

  it('renders and invokes the calendar icon control, including custom icons', () => {
    const onFocus = vi.fn();
    singleInput({
      showDefaultInputIcon: true,
      onFocus,
      customInputIcon: <span data-testid="custom-single-calendar">calendar</span>,
    });

    expect(screen.getByTestId('custom-single-calendar')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar.' }));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('omits the calendar icon when not requested and disables controls when disabled', () => {
    singleInput({ showClearDate: true, displayValue: '07/13/1991', disabled: true });

    expect(screen.queryByRole('button', { name: 'Open calendar.' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear Date' }).disabled).toBe(true);
    expect(screen.getByRole('textbox').disabled).toBe(true);
  });

  it('uses the provided screen-reader message instead of the default phrase', () => {
    singleInput({ screenReaderMessage: 'Choose your departure date.' });

    expect(screen.getByText('Choose your departure date.')).toBeTruthy();
    expect(screen.queryByText(/Navigate forward to interact with the calendar/)).toBeNull();
  });
});
