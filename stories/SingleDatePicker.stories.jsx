import React from 'react';
import { DateTime } from 'luxon';

import '../src/styles/index.css';
import SingleDatePickerExample from '../examples/SingleDatePickerWrapper.jsx';
import {
  ANCHOR_RIGHT,
  ICON_AFTER_POSITION,
  INFO_POSITION_TOP,
  NAV_POSITION_BOTTOM,
  OPEN_UP,
  VERTICAL_ORIENTATION,
} from '../src/constants.js';
import {
  allowAllDates,
  CalendarInfo,
  CustomCloseIcon,
  CustomInputIcon,
  renderCustomDayContents,
  renderNextButton,
  renderPreviousButton,
  today,
} from './storyHelpers.jsx';

export default {
  title: 'Examples/SingleDatePicker',
  parameters: { layout: 'centered' },
};

const renderPicker = (args) => <SingleDatePickerExample {...args} />;

export const Default = { render: renderPicker };
export const InitiallySelected = {
  args: { initialDate: today().plus({ days: 3 }) },
  render: renderPicker,
};
export const InAForm = {
  render: () => (
    <form style={{ display: 'grid', gap: 16 }}>
      <SingleDatePickerExample />
      <input type="text" aria-label="Guest name" placeholder="Guest name" />
      <button type="submit">Submit</button>
    </form>
  ),
};
export const ChineseLocale = {
  args: {
    initialVisibleMonth: () => DateTime.local().setLocale('zh-CN'),
    placeholder: '入住日期',
    monthFormat: (month) => month.setLocale('zh-CN').toFormat('yyyy年 LLLL'),
  },
  render: renderPicker,
};
export const RightToLeft = {
  render: () => (
    <div dir="rtl">
      <SingleDatePickerExample
        anchorDirection={ANCHOR_RIGHT}
        initialVisibleMonth={() => DateTime.local().setLocale('ar-EG')}
        isRTL
        placeholder="تاريخ"
        showClearDate
        showDefaultInputIcon
      />
    </div>
  ),
};
export const Vertical = {
  args: { orientation: VERTICAL_ORIENTATION, verticalHeight: 568 },
  render: renderPicker,
};
export const OpensUpward = { args: { openDirection: OPEN_UP }, render: renderPicker };
export const AnchorRight = { args: { anchorDirection: ANCHOR_RIGHT }, render: renderPicker };
export const OneMonth = { args: { numberOfMonths: 1 }, render: renderPicker };
export const ThreeMonths = { args: { numberOfMonths: 3 }, render: renderPicker };
export const CustomDaySize = { args: { daySize: 48, numberOfMonths: 1 }, render: renderPicker };
export const OutsideDays = { args: { enableOutsideDays: true }, render: renderPicker };
export const InitialVisibleMonth = {
  args: { initialVisibleMonth: () => today().plus({ months: 6 }) },
  render: renderPicker,
};
export const MondayFirst = { args: { firstDayOfWeek: 1 }, render: renderPicker };
export const AllDatesAllowed = { args: { isOutsideRange: allowAllDates }, render: renderPicker };
export const NextTwoWeeksOnly = {
  args: {
    isOutsideRange: (day) => day < today() || day > today().plus({ days: 14 }),
  },
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
export const BoundedNavigation = {
  args: {
    minDate: today().minus({ months: 2 }).startOf('month'),
    maxDate: today().plus({ months: 2 }).endOf('month'),
  },
  render: renderPicker,
};
export const Disabled = { args: { disabled: true }, render: renderPicker };
export const ReadOnly = { args: { readOnly: true }, render: renderPicker };
export const Required = { args: { required: true }, render: renderPicker };
export const ClearAndReopen = {
  args: { initialDate: today(), reopenPickerOnClearDate: true, showClearDate: true },
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
export const CustomInputAndCloseIcons = {
  args: {
    customCloseIcon: <CustomCloseIcon />,
    customInputIcon: <CustomInputIcon />,
    showClearDate: true,
  },
  render: renderPicker,
};
export const CalendarInfoAtTop = {
  args: { calendarInfoPosition: INFO_POSITION_TOP, renderCalendarInfo: CalendarInfo },
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
