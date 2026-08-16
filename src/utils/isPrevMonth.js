import { addMonths } from '../internal/date';
import isSameMonth from './isSameMonth';

export default function isPrevMonth(a, b) {
  return isSameMonth(addMonths(a, -1), b);
}
