import { compareDates, isDateTime } from '../internal/date';

export default function isNextDay(a, b) {
  return isDateTime(a) && compareDates(a.plus({ days: 1 }), b) === 0;
}
