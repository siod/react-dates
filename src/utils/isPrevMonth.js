import isDateTime from './isDateTime';
import isSameMonth from './isSameMonth';

export default function isPrevMonth(a, b) {
  return isDateTime(a) && isSameMonth(a.minus({ months: 1 }), b);
}
