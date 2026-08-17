import React from 'react';
import { DateTime } from 'luxon';

import '../src/styles/index.css';
import DateRangePickerExample from '../examples/DateRangePickerWrapper.jsx';
import SingleDatePickerExample from '../examples/SingleDatePickerWrapper.jsx';
import {
  ANCHOR_RIGHT,
  VERTICAL_ORIENTATION,
} from '../src/constants.js';

const month = DateTime.fromISO('2030-06-01', { zone: 'UTC' }).setLocale('en-US');
const date = (value) => DateTime.fromISO(value, { zone: 'UTC' }).setLocale('en-US');
const showMonth = () => month;
const allowAllDates = () => false;

const singleProps = {
  autoFocus: true,
  initialVisibleMonth: showMonth,
  isOutsideRange: allowAllDates,
  numberOfMonths: 1,
  transitionDuration: 0,
};

const rangeProps = {
  autoFocus: true,
  initialVisibleMonth: showMonth,
  isOutsideRange: allowAllDates,
  numberOfMonths: 2,
  transitionDuration: 0,
};
const rangeEndProps = { ...rangeProps, autoFocus: false };

export default {
  title: 'Verification/Visual',
  parameters: { layout: 'centered' },
};

export const DefaultSingle = {
  render: () => <SingleDatePickerExample {...singleProps} />,
};

export const RangePreview = {
  render: () => (
    <DateRangePickerExample
      {...rangeEndProps}
      autoFocusEndDate
      initialStartDate={date('2030-06-10')}
    />
  ),
};

export const DisabledDates = {
  render: () => (
    <SingleDatePickerExample
      {...singleProps}
      isDayBlocked={(day) => day.weekday === 6 || day.weekday === 7}
    />
  ),
};

export const RightToLeft = {
  render: () => (
    <div dir="rtl">
      <SingleDatePickerExample
        {...singleProps}
        anchorDirection={ANCHOR_RIGHT}
        initialVisibleMonth={() => month.setLocale('ar-EG')}
        isRTL
        placeholder="تاريخ"
      />
    </div>
  ),
};

export const Vertical = {
  render: () => (
    <SingleDatePickerExample
      {...singleProps}
      orientation={VERTICAL_ORIENTATION}
      verticalHeight={568}
    />
  ),
};

export const Portal = {
  render: () => <SingleDatePickerExample {...singleProps} withPortal />,
};

export const KeyboardShortcuts = {
  render: () => <SingleDatePickerExample {...singleProps} />,
};

export const NarrowRange = {
  render: () => <DateRangePickerExample {...rangeProps} />,
};
