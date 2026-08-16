import { isDateTime } from '../internal/date';
import isSameMonth from './isSameMonth';

export default function isNextMonth(a, b) {
  return isDateTime(a) && isSameMonth(a.plus({ months: 1 }), b);
}
