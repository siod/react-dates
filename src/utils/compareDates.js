import isDateTime from './isDateTime';

export default function compareDates(left, right) {
  if (!isDateTime(left) || !isDateTime(right)) return null;
  const leftDate = left.toISODate();
  const rightDate = right.toISODate();
  return leftDate < rightDate ? -1 : leftDate > rightDate ? 1 : 0;
}
