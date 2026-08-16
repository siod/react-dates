import isDateTime from './isDateTime';

export default function isSameDay(a, b) {
  if (a === b) return isDateTime(a);
  if (!isDateTime(a) || !isDateTime(b)) return false;
  return a.day === b.day
    && a.month === b.month
    && a.year === b.year;
}
