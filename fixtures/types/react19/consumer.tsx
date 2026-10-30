import type { ComponentProps } from 'react';
import { DateTime } from 'luxon';
import {
  DateRangePicker,
  SingleDatePicker,
  type DateRangePickerProps,
  type SingleDatePickerProps,
} from '@siod/react-dates';
import * as constants from '@siod/react-dates/constants';
import '@siod/react-dates/initialize';
import CalendarWeek from '@siod/react-dates/esm/components/CalendarWeek.js';
import { withStyles, type WithStylesProps } from '@siod/react-dates/lib/internal/styles/withStyles';
import isSameDay from '@siod/react-dates/lib/utils/isSameDay.js';

const date = DateTime.fromISO('2030-06-15');
const rangeProps = {
  startDate: date,
  endDate: null,
  startDateId: 'start',
  endDateId: 'end',
  focusedInput: 'startDate',
  onDatesChange: ({ endDate }) => endDate?.toISODate(),
  onFocusChange: (focusedInput) => focusedInput?.toUpperCase(),
} satisfies DateRangePickerProps;

const singleProps = {
  id: 'single',
  date,
  focused: false,
  onDateChange: (nextDate) => nextDate?.toISODate(),
  onFocusChange: (focused) => focused.valueOf(),
} satisfies SingleDatePickerProps;

interface WrappedProps extends WithStylesProps {
  label: string;
}

function Wrapped({ label }: WrappedProps) {
  return <span>{label}</span>;
}

const Styled = withStyles(() => ({ Root: { color: 'red' } }))(Wrapped);
const publicProps: ComponentProps<typeof Styled> = { label: constants.END_DATE };
const valid = (
  <>
    <DateRangePicker {...rangeProps} />
    <SingleDatePicker {...singleProps} />
    <CalendarWeek><td>{constants.START_DATE}</td></CalendarWeek>
    <Styled {...publicProps} />
  </>
);

Styled.WrappedComponent;
isSameDay(date, date);

// @ts-expect-error Injected style props are not caller-visible.
const invalidInjectedProps: ComponentProps<typeof Styled> = { label: 'x', styles: {} };
// @ts-expect-error Native Date values are not accepted.
const invalidDate: SingleDatePickerProps = { ...singleProps, date: new Date() };

export { invalidDate, invalidInjectedProps, valid };
