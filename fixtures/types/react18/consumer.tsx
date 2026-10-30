import { DateTime } from 'luxon';
import {
  DateRangePicker,
  SingleDatePicker,
  type DateRangePickerProps,
  type FocusedInput,
  type SingleDatePickerProps,
} from '@siod/react-dates';
import * as constants from '@siod/react-dates/constants';
import '@siod/react-dates/initialize';
import CalendarWeek from '@siod/react-dates/lib/components/CalendarWeek';
import isSameDay from '@siod/react-dates/esm/utils/isSameDay.js';

const startDate = DateTime.fromISO('2030-06-15');
const rangeProps = {
  startDate,
  endDate: null,
  startDateId: 'start',
  endDateId: 'end',
  focusedInput: 'startDate' as FocusedInput,
  onDatesChange: ({ startDate: nextStartDate }) => {
    nextStartDate?.toISODate();
  },
  onFocusChange: (focusedInput) => {
    focusedInput?.toUpperCase();
  },
} satisfies DateRangePickerProps;

const singleProps = {
  id: 'single',
  date: startDate,
  focused: false,
  onDateChange: (date) => date?.toISODate(),
  onFocusChange: (focused) => focused.valueOf(),
} satisfies SingleDatePickerProps;

const valid = (
  <>
    <DateRangePicker {...rangeProps} />
    <SingleDatePicker {...singleProps} />
    <CalendarWeek><td>{constants.START_DATE}</td></CalendarWeek>
  </>
);

isSameDay(startDate, startDate);

// @ts-expect-error Native Date values are not accepted.
const invalidDate: DateRangePickerProps = { ...rangeProps, startDate: new Date() };
// @ts-expect-error Month renderers are mutually exclusive.
const invalidRenderers: DateRangePickerProps = {
  ...rangeProps,
  renderMonthText: () => 'month',
  renderMonthElement: () => 'month',
};

export { invalidDate, invalidRenderers, valid };
