export default function getCalendarMonthWidth(daySize: number, calendarMonthPadding = 0) {
  return (7 * daySize) + (2 * calendarMonthPadding) + 1;
}
