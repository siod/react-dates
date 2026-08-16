import React from 'react';

import '../src/styles/index.css';
import CalendarMonth from '../src/components/CalendarMonth.jsx';
import CalendarMonthGrid from '../src/components/CalendarMonthGrid.jsx';
import DateInput from '../src/components/DateInput.jsx';
import DateRangePickerInput from '../src/components/DateRangePickerInput.jsx';
import DayPickerKeyboardShortcuts from '../src/components/DayPickerKeyboardShortcuts.jsx';
import DayPickerNavigation from '../src/components/DayPickerNavigation.jsx';
import KeyboardShortcutRow from '../src/components/KeyboardShortcutRow.jsx';
import SingleDatePickerInput from '../src/components/SingleDatePickerInput.jsx';
import { VERTICAL_ORIENTATION, VERTICAL_SCROLLABLE } from '../src/constants.js';

export default {
  title: 'Examples/Primitives',
  parameters: { layout: 'centered' },
};

function InputContainer({ children }) {
  return <div style={{ position: 'relative', width: 'fit-content' }}>{children}</div>;
}

export const CalendarMonthComponent = {
  render: () => <CalendarMonth isVisible />,
};

export const CalendarMonthGridComponent = {
  render: () => (
    <div style={{ height: 330, overflow: 'hidden', width: 330 }}>
      <CalendarMonthGrid />
    </div>
  ),
};

export const NavigationOrientations = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      {[undefined, VERTICAL_ORIENTATION, VERTICAL_SCROLLABLE].map((orientation) => (
        <div
          key={orientation || 'horizontal'}
          style={{ border: '1px solid #ddd', height: 160, position: 'relative', width: 260 }}
        >
          <DayPickerNavigation orientation={orientation} />
        </div>
      ))}
    </div>
  ),
};

export const KeyboardShortcut = {
  render: () => (
    <ul>
      <KeyboardShortcutRow
        action="Select the currently focused date"
        label="Enter key"
        unicode="↵"
      />
    </ul>
  ),
};

export const KeyboardShortcutsPanel = {
  render: () => (
    <div style={{ height: 340, position: 'relative', width: 600 }}>
      <DayPickerKeyboardShortcuts showKeyboardShortcutsPanel />
    </div>
  ),
};

export const DateInputStates = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <InputContainer><DateInput id="primitive-date-default" /></InputContainer>
      <InputContainer><DateInput disabled id="primitive-date-disabled" /></InputContainer>
      <InputContainer>
        <DateInput displayValue="16/08/2026" focused id="primitive-date-focused" />
      </InputContainer>
      <InputContainer>
        <DateInput displayValue="16/08/2026" focused id="primitive-date-caret" showCaret />
      </InputContainer>
    </div>
  ),
};

export const SingleDateInputStates = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <InputContainer><SingleDatePickerInput id="primitive-single-default" /></InputContainer>
      <InputContainer>
        <SingleDatePickerInput displayValue="16/08/2026" focused id="primitive-single-focused" />
      </InputContainer>
      <InputContainer>
        <SingleDatePickerInput
          displayValue="16/08/2026"
          id="primitive-single-clear"
          showClearDate
        />
      </InputContainer>
      <InputContainer>
        <SingleDatePickerInput id="primitive-single-icon" showDefaultInputIcon />
      </InputContainer>
    </div>
  ),
};

export const DateRangeInputStates = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <InputContainer>
        <DateRangePickerInput
          endDateId="primitive-range-default-end"
          startDateId="primitive-range-default-start"
        />
      </InputContainer>
      <InputContainer>
        <DateRangePickerInput
          endDateId="primitive-range-start-focused-end"
          isStartDateFocused
          startDateId="primitive-range-start-focused-start"
        />
      </InputContainer>
      <InputContainer>
        <DateRangePickerInput
          endDateId="primitive-range-end-focused-end"
          isEndDateFocused
          startDateId="primitive-range-end-focused-start"
        />
      </InputContainer>
      <InputContainer>
        <DateRangePickerInput
          disabled
          endDateId="primitive-range-disabled-end"
          startDateId="primitive-range-disabled-start"
        />
      </InputContainer>
      <InputContainer>
        <DateRangePickerInput
          endDate="21/08/2026"
          endDateId="primitive-range-clear-end"
          showClearDates
          startDate="16/08/2026"
          startDateId="primitive-range-clear-start"
        />
      </InputContainer>
      <InputContainer>
        <DateRangePickerInput
          endDateId="primitive-range-icon-end"
          showDefaultInputIcon
          startDateId="primitive-range-icon-start"
        />
      </InputContainer>
    </div>
  ),
};
