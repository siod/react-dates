import React from 'react';
import { DateTime } from 'luxon';

import '../src/styles/index.css';
import DateRangePickerExample from '../examples/DateRangePickerWrapper.jsx';
import SingleDatePickerExample from '../examples/SingleDatePickerWrapper.jsx';

export default {
  title: 'Pickers',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export const SingleDate = {
  render: () => <SingleDatePickerExample numberOfMonths={1} isOutsideRange={() => false} />,
};

export const SingleDateWithControls = {
  render: () => (
    <SingleDatePickerExample
      numberOfMonths={1}
      isOutsideRange={() => false}
      showClearDate
      showDefaultInputIcon
      reopenPickerOnClearDate
    />
  ),
};

export const DateRange = {
  render: () => (
    <DateRangePickerExample
      endDateId="example-end-date"
      isOutsideRange={() => false}
      numberOfMonths={2}
      startDateId="example-start-date"
    />
  ),
};

export const ArabicRtl = {
  render: () => (
    <div dir="rtl">
      <SingleDatePickerExample
        initialVisibleMonth={() => DateTime.local().setLocale('ar-EG')}
        isRTL
        numberOfMonths={1}
        isOutsideRange={() => false}
      />
    </div>
  ),
};
