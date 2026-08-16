import { compareDates } from '../internal/date';

export default function isAfterDay(a, b) {
  return compareDates(a, b) === 1;
}
