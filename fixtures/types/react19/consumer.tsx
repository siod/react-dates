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
import { subscribe } from '@siod/react-dates/lib/internal/browser/subscribe.js';
import { formatDate, parseLocalizedDate } from '@siod/react-dates/esm/internal/date/index.js';
import { withStyles, type WithStylesProps } from '@siod/react-dates/lib/internal/styles/withStyles';
import throttle from '@siod/react-dates/esm/internal/browser/throttle';
import ArrowLeft from '@siod/react-dates/esm/svg/arrow-left.js';
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
    <ArrowLeft aria-label="Previous month" />
    <Styled {...publicProps} />
  </>
);

Styled.WrappedComponent;
isSameDay(date, date);
const formatted = formatDate(date, { locale: 'en-AU', dateStyle: 'short' });
parseLocalizedDate(formatted, { locale: 'en-AU', dateStyle: 'short' });
const cleanup = subscribe(new EventTarget(), 'change', (event) => event.type);
cleanup();
const throttled = throttle((value: number) => value + 1, 10);
const throttledResult: number | undefined = throttled(1);

// @ts-expect-error Injected style props are not caller-visible.
const invalidInjectedProps: ComponentProps<typeof Styled> = { label: 'x', styles: {} };
// @ts-expect-error Native Date values are not accepted.
const invalidDate: SingleDatePickerProps = { ...singleProps, date: new Date() };

export { invalidDate, invalidInjectedProps, throttledResult, valid };
