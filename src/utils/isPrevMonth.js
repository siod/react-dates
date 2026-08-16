import { isDateTime } from '../internal/date';
import isSameMonth from './isSameMonth';

export default function isPrevMonth(a, b) {
  return isDateTime(a) && isSameMonth(a.minus({ months: 1 }), b);
}
