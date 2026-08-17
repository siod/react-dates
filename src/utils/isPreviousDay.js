import compareDates from './compareDates';
import isDateTime from './isDateTime';

export default function isPreviousDay(a, b) {
  return isDateTime(a) && compareDates(a.minus({ days: 1 }), b) === 0;
}
