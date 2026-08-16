import { isCanonicalDate } from '../internal/date';

export default function toISOMonthString(date) {
  return isCanonicalDate(date) ? date.slice(0, 7) : null;
}
