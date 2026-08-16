import { parseDate } from '../internal/date';

// Kept under its historical name for internal transition compatibility. The
// pooled value is now an immutable canonical ISO string, never a Moment object.
const datePool = new Map();

export default function getPooledMoment(dayString) {
  if (!datePool.has(dayString)) datePool.set(dayString, parseDate(dayString));
  return datePool.get(dayString);
}
