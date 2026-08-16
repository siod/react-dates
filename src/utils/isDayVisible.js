import {
  endOfWeek,
  startOfWeek,
} from '../internal/date';
import compareDates from './compareDates';
import isDateTime from './isDateTime';

export default function isDayVisible(day, month, numberOfMonths, enableOutsideDays) {
  if (!isDateTime(day) || !isDateTime(month) || !Number.isInteger(numberOfMonths)
    || numberOfMonths < 1) return false;
  const firstMonth = month.startOf('month');
  const lastMonth = month.plus({ months: numberOfMonths - 1 });
  const lower = enableOutsideDays ? startOfWeek(firstMonth) : firstMonth;
  const finalDay = lastMonth.endOf('month');
  const upper = enableOutsideDays ? endOfWeek(finalDay) : finalDay;
  const left = compareDates(day, lower);
  const right = compareDates(day, upper);
  return left != null && right != null && left >= 0 && right <= 0;
}
