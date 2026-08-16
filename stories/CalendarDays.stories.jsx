import React from 'react';

import '../src/styles/index.css';
import CalendarDay from '../src/components/CalendarDay.jsx';
import CustomizableCalendarDay from '../src/components/CustomizableCalendarDay.jsx';
import { today } from './storyHelpers.jsx';

export default {
  title: 'Examples/CalendarDay',
  parameters: { layout: 'centered' },
};

function DayTable({ children }) {
  return (
    <table role="presentation">
      <tbody><tr>{children}</tr></tbody>
    </table>
  );
}

const renderCalendarDay = (args) => (
  <DayTable><CalendarDay day={today()} {...args} /></DayTable>
);
const renderCustomizableDay = (args) => (
  <DayTable><CustomizableCalendarDay day={today()} {...args} /></DayTable>
);

export const Default = { render: renderCalendarDay };
export const Today = { args: { modifiers: new Set(['today']) }, render: renderCalendarDay };
export const Selected = { args: { modifiers: new Set(['selected']) }, render: renderCalendarDay };
export const SelectedStart = {
  args: { modifiers: new Set(['selected-start']) },
  render: renderCalendarDay,
};
export const SelectedSpan = {
  args: { modifiers: new Set(['selected-span']) },
  render: renderCalendarDay,
};
export const SelectedEnd = {
  args: { modifiers: new Set(['selected-end']) },
  render: renderCalendarDay,
};
export const Highlighted = {
  args: { modifiers: new Set(['highlighted-calendar']) },
  render: renderCalendarDay,
};
export const Blocked = {
  args: { modifiers: new Set(['blocked', 'blocked-calendar']) },
  render: renderCalendarDay,
};
export const OutsideRange = {
  args: { modifiers: new Set(['blocked', 'blocked-out-of-range']) },
  render: renderCalendarDay,
};
export const OutsideMonth = { args: { isOutsideDay: true }, render: renderCalendarDay };
export const CustomSize = { args: { daySize: 56 }, render: renderCalendarDay };
export const CustomContents = {
  args: { renderDayContents: (day) => <strong>{day.toFormat('dd')}</strong> },
  render: renderCalendarDay,
};
export const CustomColors = {
  args: {
    defaultStyles: {
      background: '#eef7ff',
      border: '1px solid #2f80ed',
      color: '#123',
      hover: { background: '#d8ecff', border: '1px solid #2f80ed', color: '#123' },
    },
  },
  render: renderCustomizableDay,
};
export const CustomSelectedColors = {
  args: {
    modifiers: new Set(['selected']),
    selectedStyles: {
      background: '#5f2eea',
      border: '1px double #5f2eea',
      color: '#fff',
    },
  },
  render: renderCustomizableDay,
};
