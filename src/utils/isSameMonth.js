import { isCanonicalDate } from '../internal/date';

export default function isSameMonth(a, b) {
  return isCanonicalDate(a) && isCanonicalDate(b) && a.slice(0, 7) === b.slice(0, 7);
}
