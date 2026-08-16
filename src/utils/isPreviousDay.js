import { addDays, compareDates } from '../internal/date';

export default function isPreviousDay(a, b) {
  const dayBefore = addDays(a, -1);
  return dayBefore != null && compareDates(dayBefore, b) === 0;
}
