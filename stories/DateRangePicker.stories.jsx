import React from 'react';
import { DateTime } from 'luxon';

import '../src/styles/index.css';
import DateRangePickerExample from '../examples/DateRangePickerWrapper.jsx';
import {
  ANCHOR_RIGHT,
  END_DATE,
  ICON_AFTER_POSITION,
  INFO_POSITION_AFTER,
  NAV_POSITION_BOTTOM,
  OPEN_UP,
  START_DATE,
  VERTICAL_ORIENTATION,
} from '../src/constants.js';
import {
  allowAllDates,
  CalendarInfo,
  CustomArrowIcon,
  CustomCloseIcon,
  CustomInputIcon,
  renderCustomDayContents,
  renderNextButton,
  renderPreviousButton,
  renderStyledCalendarDay,
  today,
} from './storyHelpers.jsx';

export default {
  title: 'Examples/DateRangePicker',
  parameters: { layout: 'centered' },
};

const renderPicker = (args) => <DateRangePickerExample {...args} />;

export const Default = { render: renderPicker };
export const InitiallySelected = {
  args: { initialEndDate: today().plus({ days: 5 }), initialStartDate: today() },
  render: renderPicker,
};
export const InAForm = {
  render: () => (
    <form style={{ display: 'grid', gap: 16 }}>
      <DateRangePickerExample />
      <input type="text" aria-label="Destination" placeholder="Destination" />
      <button type="submit">Search</button>
    </form>
  ),
};
export const ChineseLocale = {
  args: {
    endDatePlaceholderText: '退房日期',
    initialVisibleMonth: () => DateTime.local().setLocale('zh-CN'),
    monthFormat: (month) => month.setLocale('zh-CN').toFormat('yyyy年 LLLL'),
    startDatePlaceholderText: '入住日期',
  },
  render: renderPicker,
};
export const RightToLeft = {
  render: () => (
    <div dir="rtl">
      <DateRangePickerExample
        anchorDirection={ANCHOR_RIGHT}
        endDatePlaceholderText="نهاية"
        initialVisibleMonth={() => DateTime.local().setLocale('ar-EG')}
        isRTL
        showClearDates
        showDefaultInputIcon
        startDatePlaceholderText="بداية"
      />
    </div>
  ),
};
export const OpensUpward = { args: { openDirection: OPEN_UP }, render: renderPicker };
export const AnchorRight = { args: { anchorDirection: ANCHOR_RIGHT }, render: renderPicker };
export const Vertical = {
  args: { orientation: VERTICAL_ORIENTATION, verticalHeight: 568 },
  render: renderPicker,
};
export const OneMonth = { args: { numberOfMonths: 1 }, render: renderPicker };
export const ThreeMonths = { args: { numberOfMonths: 3 }, render: renderPicker };
export const CustomDaySize = { args: { daySize: 48, numberOfMonths: 1 }, render: renderPicker };
export const OutsideDays = { args: { enableOutsideDays: true }, render: renderPicker };
export const InitialVisibleMonth = {
  args: { initialVisibleMonth: () => today().plus({ months: 6 }) },
  render: renderPicker,
};
export const MondayFirst = { args: { firstDayOfWeek: 1 }, render: renderPicker };
export const SameDayRange = { args: { minimumNights: 0 }, render: renderPicker };
export const SevenNightMinimum = { args: { minimumNights: 7 }, render: renderPicker };
export const KeepOpenAfterSelection = { args: { keepOpenOnDateSelect: true }, render: renderPicker };
export const AllDatesAllowed = { args: { isOutsideRange: allowAllDates }, render: renderPicker };
export const NextTwoWeeksOnly = {
  args: { isOutsideRange: (day) => day < today() || day > today().plus({ days: 14 }) },
  render: renderPicker,
};
export const BlockedWeekends = {
  args: { isDayBlocked: (day) => day.weekday === 6 || day.weekday === 7 },
  render: renderPicker,
};
export const HighlightedWeekends = {
  args: { isDayHighlighted: (day) => day.weekday === 6 || day.weekday === 7 },
  render: renderPicker,
};
export const CustomDayContents = { args: { renderDayContents: renderCustomDayContents }, render: renderPicker };
export const CustomDayStyles = {
  args: {
    isDayHighlighted: (day) => day.weekday === 6 || day.weekday === 7,
    renderCalendarDay: renderStyledCalendarDay,
  },
  render: renderPicker,
};
export const BoundedNavigation = {
  args: {
    maxDate: today().plus({ months: 2 }).endOf('month'),
    minDate: today().minus({ months: 2 }).startOf('month'),
  },
  render: renderPicker,
};
export const Disabled = { args: { disabled: true }, render: renderPicker };
export const StartDateDisabled = { args: { disabled: START_DATE }, render: renderPicker };
export const EndDateDisabled = { args: { disabled: END_DATE }, render: renderPicker };
export const ReadOnly = { args: { readOnly: true }, render: renderPicker };
export const Required = { args: { required: true }, render: renderPicker };
export const ClearAndReopen = {
  args: {
    initialEndDate: today().plus({ days: 5 }),
    initialStartDate: today(),
    reopenPickerOnClearDates: true,
    showClearDates: true,
  },
  render: renderPicker,
};
export const CustomDisplayFormat = {
  args: { displayFormat: { day: '2-digit', month: 'short', year: 'numeric' } },
  render: renderPicker,
};
export const InputIconAfter = {
  args: { inputIconPosition: ICON_AFTER_POSITION, showDefaultInputIcon: true },
  render: renderPicker,
};
export const CustomIcons = {
  args: {
    customArrowIcon: <CustomArrowIcon />,
    customCloseIcon: <CustomCloseIcon />,
    customInputIcon: <CustomInputIcon />,
    showClearDates: true,
  },
  render: renderPicker,
};
export const CalendarInfoAfter = {
  args: { calendarInfoPosition: INFO_POSITION_AFTER, renderCalendarInfo: CalendarInfo },
  render: renderPicker,
};
export const CustomNavigation = {
  args: {
    renderNavNextButton: renderNextButton,
    renderNavPrevButton: renderPreviousButton,
  },
  render: renderPicker,
};
export const NavigationAtBottom = { args: { navPosition: NAV_POSITION_BOTTOM }, render: renderPicker };
export const WithoutKeyboardShortcuts = {
  args: { hideKeyboardShortcutsPanel: true },
  render: renderPicker,
};
export const WithoutAnimation = { args: { transitionDuration: 0 }, render: renderPicker };
export const Borderless = { args: { noBorder: true }, render: renderPicker };
export const BlockInput = { args: { block: true }, render: renderPicker };
export const SmallInput = { args: { small: true }, render: renderPicker };
export const RegularWeightInput = { args: { regular: true }, render: renderPicker };
export const Portal = { args: { withPortal: true }, render: renderPicker };
export const FullScreenPortal = { args: { withFullScreenPortal: true }, render: renderPicker };
export const AppendedToBody = { args: { appendToBody: true }, render: renderPicker };
export const DisableScrollWhileOpen = { args: { disableScroll: true }, render: renderPicker };
