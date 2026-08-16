import { isDateTime } from '../internal/date';

export default function isSameMonth(a, b) {
  return isDateTime(a) && isDateTime(b) && a.hasSame(b, 'month');
}
