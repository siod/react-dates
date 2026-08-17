import isDateTime from './isDateTime';

export default function toISOMonthString(date) {
  return isDateTime(date) ? date.toFormat('yyyy-MM') : null;
}
