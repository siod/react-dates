import { isDateTime } from '../internal/date';

export default function toISODateString(date) {
  return isDateTime(date) ? date.toISODate() : null;
}
