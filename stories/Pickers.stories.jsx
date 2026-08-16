import React from 'react';

import '../src/styles/index.css';
import { DateRangePickerExample, SingleDatePickerExample } from '../examples/PickersExample.jsx';

export default {
  title: 'Pickers',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export const SingleDate = {
  render: () => <SingleDatePickerExample numberOfMonths={1} isOutsideRange={() => false} />,
};

export const DateRange = {
  render: () => <DateRangePickerExample numberOfMonths={2} isOutsideRange={() => false} />,
};

export const ArabicRtl = {
  render: () => (
    <div dir="rtl">
      <SingleDatePickerExample
        locale="ar-EG"
        isRTL
        numberOfMonths={1}
        isOutsideRange={() => false}
      />
    </div>
  ),
};
