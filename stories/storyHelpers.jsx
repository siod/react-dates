import React from 'react';
import { DateTime } from 'luxon';

import CustomizableCalendarDay from '../src/components/CustomizableCalendarDay.jsx';

export const today = () => DateTime.local().startOf('day');
export const allowAllDates = () => false;

export function CalendarInfo() {
  return (
    <div style={{ borderTop: '1px solid #ddd', padding: 12, textAlign: 'center' }}>
      Calendar information can include pricing, policy, or help text.
    </div>
  );
}

export function CustomInputIcon() {
  return <span aria-hidden="true" style={{ color: '#007a87', fontSize: 20 }}>◉</span>;
}

export function CustomArrowIcon() {
  return <span aria-hidden="true" style={{ padding: '0 8px' }}>→</span>;
}

export function CustomCloseIcon() {
  return <span aria-hidden="true">×</span>;
}

export function renderCustomDayContents(day) {
  return (
    <span>
      <strong>{day.day}</strong>
      {day.weekday === 6 || day.weekday === 7 ? <small style={{ display: 'block' }}>weekend</small> : null}
    </span>
  );
}

export function renderStyledCalendarDay(dayProps) {
  return (
    <CustomizableCalendarDay
      {...dayProps}
      selectedStyles={{
        background: '#5f2eea',
        border: '1px double #5f2eea',
        color: '#fff',
      }}
      highlightedCalendarStyles={{
        background: '#fff1b8',
        border: '1px solid #f2c94c',
        color: '#333',
      }}
    />
  );
}

export function renderMonthAndYear({ month }) {
  return <strong>{month.toFormat('LLLL yyyy')}</strong>;
}

export function renderWeekHeader(label) {
  return <abbr title={label}>{label.slice(0, 2)}</abbr>;
}

export function renderPreviousButton(buttonProps) {
  const { ariaLabel, ...props } = buttonProps;
  return <button {...props} type="button" aria-label={ariaLabel}>Previous</button>;
}

export function renderNextButton(buttonProps) {
  const { ariaLabel, ...props } = buttonProps;
  return <button {...props} type="button" aria-label={ariaLabel}>Next</button>;
}
