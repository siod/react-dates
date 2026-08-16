import {
  addMonths,
  compareDates,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from '../internal/date';

export default function isDayVisible(day, month, numberOfMonths, enableOutsideDays) {
  if (typeof day !== 'string' || typeof month !== 'string' || !Number.isInteger(numberOfMonths)
    || numberOfMonths < 1) return false;
  const firstMonth = startOfMonth(month);
  const lastMonth = addMonths(month, numberOfMonths - 1);
  if (!firstMonth || !lastMonth) return false;
  const lower = enableOutsideDays ? startOfWeek(firstMonth) : firstMonth;
  const finalDay = endOfMonth(lastMonth);
  const upper = enableOutsideDays ? endOfWeek(finalDay) : finalDay;
  const left = compareDates(day, lower);
  const right = compareDates(day, upper);
  return left != null && right != null && left >= 0 && right <= 0;
}
