import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DateInput from '../../../src/components/DateInput.jsx';

afterEach(cleanup);

function renderInput(overrides = {}) {
  return render(<DateInput id="date" {...overrides} />);
}

describe('DateInput observable legacy behavior', () => {
  it('uses ariaLabel or placeholder, title, display value, and native input flags', () => {
    renderInput({
      ariaLabel: 'Arrival date',
      placeholder: 'Choose an arrival date',
      titleText: 'Arrival',
      displayValue: '07/13/1991',
      autoComplete: 'off',
      required: true,
      readOnly: true,
    });
    const input = screen.getByRole('textbox', { name: 'Arrival date' });

    expect(input.value).toBe('07/13/1991');
    expect(input.getAttribute('placeholder')).toBe('Choose an arrival date');
    expect(input.getAttribute('title')).toBe('Arrival');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.required).toBe(true);
    expect(input.readOnly).toBe(true);
  });

  it('falls back to the placeholder for an absent aria label and omits a null label', () => {
    const { rerender } = renderInput({ placeholder: 'Select a date' });
    expect(screen.getByRole('textbox', { name: 'Select a date' })).toBeTruthy();

    rerender(<DateInput id="date" ariaLabel={null} placeholder="Select a date" />);
    expect(screen.getByRole('textbox').getAttribute('aria-label')).toBeNull();
  });

  it('renders and wires the screen-reader description', () => {
    renderInput({ screenReaderMessage: 'Use the calendar to choose a date.' });
    const input = screen.getByRole('textbox');
    const description = screen.getByText('Use the calendar to choose a date.');

    expect(description.id).toBe('DateInput__screen-reader-message-date');
    expect(input.getAttribute('aria-describedby')).toBe(
      'DateInput__screen-reader-message-date',
    );
  });

  it('stores typed text and emits it through onChange', () => {
    const onChange = vi.fn();
    renderInput({ onChange });
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '1991-07-13' } });

    expect(input.value).toBe('1991-07-13');
    expect(onChange).toHaveBeenCalledWith('1991-07-13');
  });

  it('routes a question mark typed through change to the question callback', () => {
    const onChange = vi.fn();
    const onKeyDownQuestionMark = vi.fn();
    renderInput({ onChange, onKeyDownQuestionMark });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1991?' } });

    expect(onKeyDownQuestionMark).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('dispatches Tab, Shift+Tab, ArrowDown, and question-mark key callbacks', () => {
    const callbacks = {
      onKeyDownTab: vi.fn(),
      onKeyDownShiftTab: vi.fn(),
      onKeyDownArrowDown: vi.fn(),
      onKeyDownQuestionMark: vi.fn(),
    };
    vi.useFakeTimers();
    renderInput(callbacks);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'Tab', shiftKey: false });
    vi.advanceTimersByTime(301);
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    vi.advanceTimersByTime(301);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    vi.advanceTimersByTime(301);
    fireEvent.keyDown(input, { key: '?' });
    vi.advanceTimersByTime(301);

    vi.useRealTimers();

    expect(callbacks.onKeyDownTab).toHaveBeenCalledTimes(1);
    expect(callbacks.onKeyDownShiftTab).toHaveBeenCalledTimes(1);
    expect(callbacks.onKeyDownArrowDown).toHaveBeenCalledTimes(1);
    expect(callbacks.onKeyDownQuestionMark).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch final-key callbacks for unrelated keys', () => {
    const onKeyDownArrowDown = vi.fn();
    const onKeyDownTab = vi.fn();
    renderInput({ onKeyDownArrowDown, onKeyDownTab });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(onKeyDownArrowDown).not.toHaveBeenCalled();
    expect(onKeyDownTab).not.toHaveBeenCalled();
  });

  it('lets a new controlled display value replace in-progress typed text', () => {
    const { rerender } = renderInput({ displayValue: 'initial' });
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'in progress' } });
    expect(input.value).toBe('in progress');

    rerender(<DateInput id="date" displayValue="07/13/1991" />);

    expect(input.value).toBe('07/13/1991');
  });

  it('moves focus to the input when both focused props become true', () => {
    const { rerender } = renderInput({ focused: false, isFocused: false });
    const input = screen.getByRole('textbox');

    rerender(<DateInput id="date" focused isFocused />);

    expect(document.activeElement).toBe(input);
  });

  it('supports disabled, read-only false, and required input states', () => {
    renderInput({ disabled: true, readOnly: false, required: true });
    const input = screen.getByRole('textbox');

    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(false);
    expect(input.required).toBe(true);
  });
});
