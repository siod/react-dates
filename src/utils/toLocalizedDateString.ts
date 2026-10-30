import type { DateTime } from 'luxon';

import {
  formatDate,
  type DateAdapterOptions,
} from '../internal/date/index.js';

export default function toLocalizedDateString(
  date?: DateTime | null,
  options: DateAdapterOptions = {},
) {
  return formatDate(date, options) || null;
}
