import type { DateTime } from 'luxon';

import isDateTime from './isDateTime.js';

export type DateComparison = -1 | 0 | 1;

export default function compareDates(
  left: DateTime | null | undefined,
  right: DateTime | null | undefined,
): DateComparison | null {
  if (left === right) return isDateTime(left) ? 0 : null;
  if (!isDateTime(left) || !isDateTime(right)) return null;
  if (left.year !== right.year) return left.year < right.year ? -1 : 1;
  if (left.month !== right.month) return left.month < right.month ? -1 : 1;
  if (left.day !== right.day) return left.day < right.day ? -1 : 1;
  return 0;
}
