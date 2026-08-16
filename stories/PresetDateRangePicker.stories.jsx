import React from 'react';

import '../src/styles/index.css';
import PresetDateRangePickerExample from '../examples/PresetDateRangePicker.jsx';
import { today } from './storyHelpers.jsx';

export default {
  title: 'Examples/PresetDateRangePicker',
  parameters: { layout: 'centered' },
};

export const CommonRanges = {
  render: () => (
    <PresetDateRangePickerExample
      numberOfMonths={2}
      autoFocusEndDate
      presets={[
        { text: 'Today', start: today(), end: today() },
        { text: 'Next 7 days', start: today(), end: today().plus({ days: 6 }) },
        { text: 'Next 30 days', start: today(), end: today().plus({ days: 29 }) },
      ]}
    />
  ),
};
