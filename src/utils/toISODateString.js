import { parseDate } from '../internal/date';

export default function toISODateString(date) {
  return parseDate(date);
}
