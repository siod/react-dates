import compareDates from './compareDates';
import isDateTime from './isDateTime';

export default function isNextDay(a, b) {
  return isDateTime(a) && compareDates(a.plus({ days: 1 }), b) === 0;
}
