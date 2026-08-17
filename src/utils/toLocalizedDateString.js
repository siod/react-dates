import { formatDate } from '../internal/date';

export default function toLocalizedDateString(date, options = {}) {
  return formatDate(date, options) || null;
}
