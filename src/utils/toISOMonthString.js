import { isDateTime } from '../internal/date';

export default function toISOMonthString(date) {
  return isDateTime(date) ? date.toFormat('yyyy-MM') : null;
}
