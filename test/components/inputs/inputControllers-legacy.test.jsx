import React from 'react';
import { DateTime, Settings } from 'luxon';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../helpers/index.js';
import DateRangePickerInputController from '../../../src/components/DateRangePickerInputController.jsx';
import SingleDatePickerInputController from '../../../src/components/SingleDatePickerInputController.jsx';
import { END_DATE, START_DATE } from '../../../src/constants';

afterEach(() => {
  Settings.defaultLocale = null;
  cleanup();
});

function singleProps(overrides = {}) {
  return {
    id: 'date',
    date: null,
    onDateChange: vi.fn(),
    onFocusChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

function rangeProps(overrides = {}) {
  return {
    startDate: null,
    endDate: null,
    onDatesChange: vi.fn(),
    onFocusChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe('SingleDatePickerInputController observable legacy behavior', () => {
  it('parses a valid date, emits a Luxon DateTime, and closes the picker', () => {
    const props = singleProps({ isOutsideRange: () => false });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2099-02-03' } });

    const emitted = props.onDateChange.mock.calls[0][0];
    expect(emitted).toBeInstanceOf(DateTime);
    expect(emitted.toISODate()).toBe('2099-02-03');
    expect(props.onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(props.onClose).toHaveBeenCalledWith({ date: emitted });
  });

  it('keeps the picker open when keepOpenOnDateSelect is enabled', () => {
    const props = singleProps({
      isOutsideRange: () => false,
      keepOpenOnDateSelect: true,
    });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2099-02-03' } });

    expect(props.onDateChange).toHaveBeenCalledWith(expect.any(DateTime));
    expect(props.onFocusChange).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed', 'not-a-date', {}],
    ['outside range', '2099-02-03', { isOutsideRange: () => true }],
    ['blocked', '2099-02-03', { isOutsideRange: () => false, isDayBlocked: () => true }],
  ])('returns null for %s input without changing focus', (_label, value, overrides) => {
    const props = singleProps(overrides);
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value } });

    expect(props.onDateChange).toHaveBeenCalledWith(null);
    expect(props.onFocusChange).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('formats an existing DateTime through a formatter callback without changing its locale', () => {
    const date = DateTime.fromISO('2099-02-03').setLocale('en-GB');
    const formatter = vi.fn((value) => `formatted:${value.toISODate()}`);
    const props = singleProps({ date, displayFormat: formatter });
    renderStrict(<SingleDatePickerInputController {...props} />);

    expect(screen.getByRole('textbox').value).toBe('formatted:2099-02-03');
    expect(formatter).toHaveBeenCalledWith(date);
    expect(formatter.mock.calls[0][0].locale).toBe('en-GB');
  });

  it('parses the localized default format using Luxon defaultLocale', () => {
    Settings.defaultLocale = 'en-GB';
    const props = singleProps({ isOutsideRange: () => false });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '03/02/2024' } });

    const emitted = props.onDateChange.mock.calls[0][0];
    expect(emitted.toISODate()).toBe('2024-02-03');
    expect(emitted.locale).toBe('en-GB');
  });

  it('reports focus and ignores focus when disabled', () => {
    const onFocusChange = vi.fn();
    const { rerender } = renderStrict(
      <SingleDatePickerInputController {...singleProps({ onFocusChange })} />,
    );
    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocusChange).toHaveBeenCalledWith({ focused: true });

    onFocusChange.mockClear();
    rerender(
      <SingleDatePickerInputController
        {...singleProps({ disabled: true, onFocusChange })}
      />,
    );
    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocusChange).not.toHaveBeenCalled();
  });

  it('clears a date and optionally requests focus again', () => {
    const props = singleProps({
      date: DateTime.fromISO('2099-02-03'),
      showClearDate: true,
      reopenPickerOnClearDate: true,
    });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear Date' }));

    expect(props.onDateChange).toHaveBeenCalledWith(null);
    expect(props.onFocusChange).toHaveBeenCalledWith({ focused: true });
  });

  it('clears focus through the start-of-input Shift+Tab callback', () => {
    const date = DateTime.fromISO('2099-02-03');
    const props = singleProps({ date, focused: true });
    renderStrict(<SingleDatePickerInputController {...props} />);

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Tab', shiftKey: true });

    expect(props.onFocusChange).toHaveBeenCalledWith({ focused: false });
    expect(props.onClose).toHaveBeenCalledWith({ date });
  });
});

describe('DateRangePickerInputController observable legacy behavior', () => {
  it('renders both inputs and forwards children', () => {
    const child = <span data-testid="range-controller-child">custom content</span>;
    renderStrict(<DateRangePickerInputController>{child}</DateRangePickerInputController>);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.getByTestId('range-controller-child')).toBeTruthy();
  });

  it('accepts a valid start date and advances focus to the end date', () => {
    const props = rangeProps({ isOutsideRange: () => false });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '2099-02-03' } });

    const result = props.onDatesChange.mock.calls[0][0];
    expect(result.startDate).toBeInstanceOf(DateTime);
    expect(result.startDate.toISODate()).toBe('2099-02-03');
    expect(result.endDate).toBeNull();
    expect(props.onFocusChange).toHaveBeenCalledWith(END_DATE);
  });

  it('accepts a valid end date, closes, and preserves the selected start date', () => {
    const startDate = DateTime.fromISO('2099-02-03');
    const props = rangeProps({ startDate, isOutsideRange: () => false });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '2099-02-05' } });

    const result = props.onDatesChange.mock.calls[0][0];
    expect(result).toEqual({ startDate, endDate: expect.any(DateTime) });
    expect(result.endDate.toISODate()).toBe('2099-02-05');
    expect(props.onFocusChange).toHaveBeenCalledWith(null);
    expect(props.onClose).toHaveBeenCalledWith(result);
  });

  it('keeps a valid end date open when keepOpenOnDateSelect is enabled', () => {
    const props = rangeProps({
      startDate: DateTime.fromISO('2099-02-03'),
      keepOpenOnDateSelect: true,
      isOutsideRange: () => false,
    });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '2099-02-05' } });

    expect(props.onDatesChange).toHaveBeenCalledWith({
      startDate: props.startDate,
      endDate: expect.any(DateTime),
    });
    expect(props.onFocusChange).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed', 'not-a-date', {}],
    ['outside range', '2099-02-05', { isOutsideRange: () => true }],
    ['blocked', '2099-02-05', { isOutsideRange: () => false, isDayBlocked: () => true }],
  ])('rejects %s end dates while preserving the start date', (_label, value, overrides) => {
    const startDate = DateTime.fromISO('2099-02-03');
    const props = rangeProps({ startDate, ...overrides });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value } });

    expect(props.onDatesChange).toHaveBeenCalledWith({ startDate, endDate: null });
    expect(props.onFocusChange).not.toHaveBeenCalled();
  });

  it('rejects an end date that does not meet minimum nights', () => {
    const startDate = DateTime.fromISO('2099-02-10');
    const props = rangeProps({
      startDate,
      minimumNights: 2,
      isOutsideRange: () => false,
    });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '2099-02-11' } });

    expect(props.onDatesChange).toHaveBeenCalledWith({ startDate, endDate: null });
    expect(props.onFocusChange).not.toHaveBeenCalled();
  });

  it('allows a same-day range when minimumNights is zero', () => {
    const date = DateTime.fromISO('2099-02-10');
    const props = rangeProps({
      startDate: date,
      minimumNights: 0,
      isOutsideRange: () => false,
    });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '2099-02-10' } });

    expect(props.onDatesChange).toHaveBeenCalledWith({
      startDate: date,
      endDate: expect.any(DateTime),
    });
  });

  it('clears an existing end date when a new start makes it invalid', () => {
    const endDate = DateTime.fromISO('2099-02-05');
    const props = rangeProps({ endDate, minimumNights: 2, isOutsideRange: () => false });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '2099-02-10' } });

    expect(props.onDatesChange).toHaveBeenCalledWith({
      startDate: expect.any(DateTime),
      endDate: null,
    });
    expect(props.onFocusChange).toHaveBeenCalledWith(END_DATE);
  });

  it('focuses only enabled range inputs and starts at START_DATE in full-screen mode', () => {
    const onFocusChange = vi.fn();
    const { rerender } = renderStrict(
      <DateRangePickerInputController
        {...rangeProps({ disabled: START_DATE, onFocusChange })}
      />,
    );
    fireEvent.focus(screen.getAllByRole('textbox')[0]);
    expect(onFocusChange).not.toHaveBeenCalled();
    fireEvent.focus(screen.getAllByRole('textbox')[1]);
    expect(onFocusChange).toHaveBeenCalledWith(END_DATE);

    onFocusChange.mockClear();
    rerender(
      <DateRangePickerInputController
        {...rangeProps({ withFullScreenPortal: true, onFocusChange })}
      />,
    );
    fireEvent.focus(screen.getAllByRole('textbox')[1]);
    expect(onFocusChange).toHaveBeenCalledWith(START_DATE);
  });

  it('clears both dates and optionally reopens at START_DATE', () => {
    const props = rangeProps({
      startDate: DateTime.fromISO('2099-02-03'),
      endDate: DateTime.fromISO('2099-02-05'),
      showClearDates: true,
      reopenPickerOnClearDates: true,
    });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear Dates' }));

    expect(props.onDatesChange).toHaveBeenCalledWith({ startDate: null, endDate: null });
    expect(props.onFocusChange).toHaveBeenCalledWith(START_DATE);
  });

  it('clears focus from the start field through Shift+Tab and closes with both dates', () => {
    const startDate = DateTime.fromISO('2099-02-03');
    const endDate = DateTime.fromISO('2099-02-05');
    const props = rangeProps({ startDate, endDate });
    renderStrict(<DateRangePickerInputController {...props} />);

    fireEvent.keyDown(screen.getAllByRole('textbox')[0], { key: 'Tab', shiftKey: true });

    expect(props.onFocusChange).toHaveBeenCalledWith(null);
    expect(props.onClose).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('passes localized DateTimes to a range display formatter', () => {
    const startDate = DateTime.fromISO('2099-02-03').setLocale('en-GB');
    const endDate = DateTime.fromISO('2099-02-05').setLocale('en-GB');
    const formatter = vi.fn((value) => `formatted:${value.toISODate()}`);
    renderStrict(
      <DateRangePickerInputController
        {...rangeProps({ startDate, endDate, displayFormat: formatter })}
      />,
    );

    expect(screen.getAllByRole('textbox')[0].value).toBe('formatted:2099-02-03');
    expect(screen.getAllByRole('textbox')[1].value).toBe('formatted:2099-02-05');
    expect(formatter.mock.calls[0][0]).toBe(startDate);
    expect(formatter.mock.calls[1][0]).toBe(endDate);
  });
});
