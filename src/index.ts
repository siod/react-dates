import type { ComponentType } from 'react';

import CalendarDayComponent from './components/CalendarDay';
import CalendarMonthComponent from './components/CalendarMonth';
import CalendarMonthGridComponent from './components/CalendarMonthGrid';
import CustomizableCalendarDayComponent from './components/CustomizableCalendarDay';
import DateRangePickerComponent from './components/DateRangePicker';
import DateRangePickerInputComponent from './components/DateRangePickerInput';
import DateRangePickerInputControllerComponent from './components/DateRangePickerInputController';
import DayPickerComponent from './components/DayPicker';
import DayPickerRangeControllerComponent from './components/DayPickerRangeController';
import DayPickerSingleDateControllerComponent from './components/DayPickerSingleDateController';
import SingleDatePickerComponent from './components/SingleDatePicker';
import SingleDatePickerInputComponent from './components/SingleDatePickerInput';
import DateRangePickerShapeValue from './shapes/DateRangePickerShape.js';
import SingleDatePickerShapeValue from './shapes/SingleDatePickerShape.js';

import type {
  CalendarDayProps,
  CalendarMonthGridProps,
  CalendarMonthProps,
  CustomizableCalendarDayProps,
  DateRangePickerInputControllerProps,
  DateRangePickerInputProps,
  DateRangePickerProps,
  DayPickerProps,
  DayPickerRangeControllerProps,
  DayPickerSingleDateControllerProps,
  SingleDatePickerInputProps,
  SingleDatePickerProps,
} from './types.js';

export const CalendarDay = CalendarDayComponent as ComponentType<CalendarDayProps>;
export const CalendarMonth = CalendarMonthComponent as ComponentType<CalendarMonthProps>;
export const CalendarMonthGrid = CalendarMonthGridComponent as ComponentType<CalendarMonthGridProps>;
export const CustomizableCalendarDay = CustomizableCalendarDayComponent as ComponentType<CustomizableCalendarDayProps>;
export const DateRangePicker = DateRangePickerComponent as ComponentType<DateRangePickerProps>;
export const DateRangePickerInput = DateRangePickerInputComponent as ComponentType<DateRangePickerInputProps>;
export const DateRangePickerInputController = DateRangePickerInputControllerComponent as ComponentType<DateRangePickerInputControllerProps>;
export const DayPicker = DayPickerComponent as ComponentType<DayPickerProps>;
export const DayPickerRangeController = DayPickerRangeControllerComponent as ComponentType<DayPickerRangeControllerProps>;
export const DayPickerSingleDateController = DayPickerSingleDateControllerComponent as ComponentType<DayPickerSingleDateControllerProps>;
export const SingleDatePicker = SingleDatePickerComponent as ComponentType<SingleDatePickerProps>;
export const SingleDatePickerInput = SingleDatePickerInputComponent as ComponentType<SingleDatePickerInputProps>;

export const DateRangePickerShape = DateRangePickerShapeValue as Record<string, unknown>;
export const SingleDatePickerShape = SingleDatePickerShapeValue as Record<string, unknown>;
export { default as isInclusivelyAfterDay } from './utils/isInclusivelyAfterDay.js';
export { default as isInclusivelyBeforeDay } from './utils/isInclusivelyBeforeDay.js';
export { default as isNextDay } from './utils/isNextDay.js';
export { default as isSameDay } from './utils/isSameDay.js';
export { default as toISODateString } from './utils/toISODateString.js';
export { default as toLocalizedDateString } from './utils/toLocalizedDateString.js';

export type * from './types.js';
