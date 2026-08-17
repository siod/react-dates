import React from 'react';
import { DateTime } from 'luxon';

import '../src/styles/index.css';
import DayPicker from '../src/components/DayPicker.jsx';
import {
  INFO_POSITION_AFTER,
  NAV_POSITION_BOTTOM,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
} from '../src/constants.js';
import {
  CalendarInfo,
  renderCustomDayContents,
  renderMonthAndYear,
  renderNextButton,
  renderPreviousButton,
  renderWeekHeader,
  today,
} from './storyHelpers.jsx';

export default {
  title: 'Examples/DayPicker',
  component: DayPicker,
  parameters: { layout: 'centered' },
};

const renderDayPicker = (args) => <DayPicker {...args} />;

export const Default = { render: renderDayPicker };
export const OneMonth = { args: { numberOfMonths: 1 }, render: renderDayPicker };
export const ThreeMonths = { args: { numberOfMonths: 3 }, render: renderDayPicker };
export const CustomDaySize = { args: { daySize: 48, numberOfMonths: 1 }, render: renderDayPicker };
export const Vertical = {
  args: { orientation: VERTICAL_ORIENTATION, verticalHeight: 560 },
  render: renderDayPicker,
};
export const VerticalScrollable = {
  args: { orientation: VERTICAL_SCROLLABLE, verticalHeight: 560 },
  render: renderDayPicker,
};
export const RightToLeft = {
  render: () => (
    <div dir="rtl">
      <DayPicker
        initialVisibleMonth={() => DateTime.local().setLocale('ar-EG')}
        isRTL
      />
    </div>
  ),
};
export const InitialVisibleMonth = {
  args: { initialVisibleMonth: () => today().plus({ months: 6 }) },
  render: renderDayPicker,
};
export const MondayFirst = { args: { firstDayOfWeek: 1 }, render: renderDayPicker };
export const OutsideDays = { args: { enableOutsideDays: true }, render: renderDayPicker };
export const CustomMonthAndWeekdays = {
  args: {
    renderMonthElement: renderMonthAndYear,
    renderWeekHeaderElement: renderWeekHeader,
  },
  render: renderDayPicker,
};
export const CustomDayContents = {
  args: { renderDayContents: renderCustomDayContents },
  render: renderDayPicker,
};
export const CalendarInfoAfter = {
  args: { calendarInfoPosition: INFO_POSITION_AFTER, renderCalendarInfo: CalendarInfo },
  render: renderDayPicker,
};
export const CustomNavigation = {
  args: {
    renderNavNextButton: renderNextButton,
    renderNavPrevButton: renderPreviousButton,
  },
  render: renderDayPicker,
};
export const NavigationAtBottom = {
  args: { navPosition: NAV_POSITION_BOTTOM },
  render: renderDayPicker,
};
export const WithoutNavigation = { args: { noNavButtons: true }, render: renderDayPicker };
export const WithoutNextNavigation = { args: { noNavNextButton: true }, render: renderDayPicker };
export const WithoutPreviousNavigation = { args: { noNavPrevButton: true }, render: renderDayPicker };
export const WithoutKeyboardShortcuts = {
  args: { hideKeyboardShortcutsPanel: true },
  render: renderDayPicker,
};
export const WithoutAnimation = { args: { transitionDuration: 0 }, render: renderDayPicker };
export const WithoutBorder = { args: { noBorder: true }, render: renderDayPicker };
