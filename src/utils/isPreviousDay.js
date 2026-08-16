import { compareDates, isDateTime } from '../internal/date';

export default function isPreviousDay(a, b) {
  return isDateTime(a) && compareDates(a.minus({ days: 1 }), b) === 0;
}
