import { useState } from 'react';
import { DateTime } from 'luxon';

import {
  DateRangePicker,
  DayPickerRangeController,
  SingleDatePicker,
  type DateRange,
  type FocusedInput,
} from '../src/index.js';

export function TypeScriptDateRangePickerExample() {
  const [dates, setDates] = useState<DateRange>({ startDate: null, endDate: null });
  const [focusedInput, setFocusedInput] = useState<FocusedInput>(null);

  return (
    <DateRangePicker
      endDate={dates.endDate}
      endDateId="typescript-example-end-date"
      focusedInput={focusedInput}
      isOutsideRange={() => false}
      onDatesChange={setDates}
      onFocusChange={setFocusedInput}
      startDate={dates.startDate}
      startDateId="typescript-example-start-date"
    />
  );
}

export function TypeScriptSingleDatePickerExample() {
  const [date, setDate] = useState<DateTime | null>(null);
  const [focused, setFocused] = useState(false);

  return (
    <SingleDatePicker
      date={date}
      focused={focused}
      id="typescript-example-date"
      isOutsideRange={() => false}
      onDateChange={setDate}
      onFocusChange={({ focused: nextFocused }) => setFocused(nextFocused)}
    />
  );
}

export function TypeScriptRangeControllerExample() {
  const [dates, setDates] = useState<DateRange>({ startDate: null, endDate: null });
  const [focusedInput, setFocusedInput] = useState<FocusedInput>('startDate');

  return (
    <DayPickerRangeController
      endDate={dates.endDate}
      focusedInput={focusedInput}
      isOutsideRange={() => false}
      onDatesChange={setDates}
      onFocusChange={setFocusedInput}
      startDate={dates.startDate}
    />
  );
}
