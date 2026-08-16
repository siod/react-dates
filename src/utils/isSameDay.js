import { compareDates } from '../internal/date';

export default function isSameDay(a, b) {
  return compareDates(a, b) === 0;
}
