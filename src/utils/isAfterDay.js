import compareDates from './compareDates';

export default function isAfterDay(a, b) {
  return compareDates(a, b) === 1;
}
