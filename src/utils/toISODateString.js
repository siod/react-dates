import isDateTime from './isDateTime';

export default function toISODateString(date) {
  return isDateTime(date) ? date.toISODate() : null;
}
