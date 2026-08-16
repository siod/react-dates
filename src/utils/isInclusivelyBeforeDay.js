import { compareDates } from '../internal/date';

export default function isInclusivelyBeforeDay(a, b) {
  const comparison = compareDates(a, b);
  return comparison === 0 || comparison === -1;
}
