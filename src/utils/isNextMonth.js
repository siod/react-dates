import { addMonths } from '../internal/date';
import isSameMonth from './isSameMonth';

export default function isNextMonth(a, b) {
  return isSameMonth(addMonths(a, 1), b);
}
