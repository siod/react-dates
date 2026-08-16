import { addDays, compareDates } from '../internal/date';

export default function isNextDay(a, b) {
  const nextDay = addDays(a, 1);
  return nextDay != null && compareDates(nextDay, b) === 0;
}
