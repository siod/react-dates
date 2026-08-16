import React, { useState } from 'react';

import DateRangePicker from '../src/components/DateRangePicker.jsx';
import SingleDatePicker from '../src/components/SingleDatePicker.jsx';

export function SingleDatePickerExample(props) {
  const [date, setDate] = useState(null);
  const [focused, setFocused] = useState(false);

  return (
    <SingleDatePicker
      {...props}
      id="example-single-date"
      date={date}
      focused={focused}
      onDateChange={setDate}
      onFocusChange={({ focused: nextFocused }) => setFocused(nextFocused)}
    />
  );
}

export function DateRangePickerExample(props) {
  const [dates, setDates] = useState({ startDate: null, endDate: null });
  const [focusedInput, setFocusedInput] = useState(null);

  return (
    <DateRangePicker
      {...props}
      startDate={dates.startDate}
      startDateId="example-start-date"
      endDate={dates.endDate}
      endDateId="example-end-date"
      focusedInput={focusedInput}
      onDatesChange={setDates}
      onFocusChange={setFocusedInput}
    />
  );
}
