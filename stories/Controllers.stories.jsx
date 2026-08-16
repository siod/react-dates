import React from 'react';
import { DateTime } from 'luxon';

import '../src/styles/index.css';
import DayPickerRangeControllerExample from '../examples/DayPickerRangeControllerWrapper.jsx';
import DayPickerSingleDateControllerExample from '../examples/DayPickerSingleDateControllerWrapper.jsx';
import {
  INFO_POSITION_TOP,
  NAV_POSITION_BOTTOM,
  START_DATE,
  VERTICAL_SCROLLABLE,
} from '../src/constants.js';
import {
  CalendarInfo,
  renderCustomDayContents,
  renderMonthAndYear,
  renderNextButton,
  renderPreviousButton,
  renderStyledCalendarDay,
  renderWeekHeader,
  today,
} from './storyHelpers.jsx';

export default {
  title: 'Examples/Controllers',
  parameters: { layout: 'centered' },
};

const renderSingle = (args) => <DayPickerSingleDateControllerExample {...args} />;
const renderRange = (args) => <DayPickerRangeControllerExample {...args} />;

export const SingleDate = { render: renderSingle };
export const SingleDateSelected = {
  args: { initialDate: today().plus({ days: 2 }) },
  render: renderSingle,
};
export const SingleDateAllowUnselect = {
  args: { allowUnselect: true, initialDate: today() },
  render: renderSingle,
};
export const SingleDateThreeMonths = { args: { numberOfMonths: 3 }, render: renderSingle };
export const SingleDateScrollable = {
  args: { orientation: VERTICAL_SCROLLABLE, verticalHeight: 560 },
  render: renderSingle,
};
export const SingleDateBounded = {
  args: {
    maxDate: today().plus({ months: 2 }).endOf('month'),
    minDate: today().minus({ months: 2 }).startOf('month'),
  },
  render: renderSingle,
};
export const SingleDateCustomContent = {
  args: { renderDayContents: renderCustomDayContents },
  render: renderSingle,
};
export const SingleDateCustomStyles = {
  args: {
    isDayHighlighted: (day) => day.weekday === 6 || day.weekday === 7,
    renderCalendarDay: renderStyledCalendarDay,
  },
  render: renderSingle,
};
export const DateRange = { render: renderRange };
export const DateRangeSelected = {
  args: { initialEndDate: today().plus({ days: 5 }), initialStartDate: today() },
  render: renderRange,
};
export const DateRangeFocusedOnEnd = {
  args: { autoFocusEndDate: true, initialStartDate: today() },
  render: renderRange,
};
export const DateRangeSameDay = { args: { minimumNights: 0 }, render: renderRange };
export const DateRangeSevenNightMinimum = { args: { minimumNights: 7 }, render: renderRange };
export const DateRangeKeepOpen = { args: { keepOpenOnDateSelect: true }, render: renderRange };
export const DateRangeStartDisabled = { args: { disabled: START_DATE }, render: renderRange };
export const DateRangeThreeMonths = { args: { numberOfMonths: 3 }, render: renderRange };
export const DateRangeScrollable = {
  args: { orientation: VERTICAL_SCROLLABLE, verticalHeight: 560 },
  render: renderRange,
};
export const DateRangeOutsideDays = { args: { enableOutsideDays: true }, render: renderRange };
export const DateRangeMondayFirst = { args: { firstDayOfWeek: 1 }, render: renderRange };
export const DateRangeInitialMonth = {
  args: { initialVisibleMonth: () => today().plus({ months: 6 }) },
  render: renderRange,
};
export const DateRangeFrenchLocale = {
  args: {
    initialVisibleMonth: () => DateTime.local().setLocale('fr-FR'),
    monthFormat: (month) => month.setLocale('fr-FR').toFormat('LLLL yyyy'),
  },
  render: renderRange,
};
export const DateRangeCustomMonthAndWeekdays = {
  args: {
    renderMonthElement: renderMonthAndYear,
    renderWeekHeaderElement: renderWeekHeader,
  },
  render: renderRange,
};
export const DateRangeCalendarInfo = {
  args: { calendarInfoPosition: INFO_POSITION_TOP, renderCalendarInfo: CalendarInfo },
  render: renderRange,
};
export const DateRangeCustomNavigation = {
  args: {
    renderNavNextButton: renderNextButton,
    renderNavPrevButton: renderPreviousButton,
  },
  render: renderRange,
};
export const DateRangeNavigationAtBottom = {
  args: { navPosition: NAV_POSITION_BOTTOM },
  render: renderRange,
};
export const DateRangeWithoutNavigation = { args: { noNavButtons: true }, render: renderRange };
export const DateRangeWithoutNextNavigation = {
  args: { noNavNextButton: true },
  render: renderRange,
};
export const DateRangeWithoutPreviousNavigation = {
  args: { noNavPrevButton: true },
  render: renderRange,
};
export const DateRangeWithoutKeyboardShortcuts = {
  args: { hideKeyboardShortcutsPanel: true },
  render: renderRange,
};
export const DateRangeNoAnimation = { args: { transitionDuration: 0 }, render: renderRange };
export const DateRangeNoBorder = { args: { noBorder: true }, render: renderRange };
