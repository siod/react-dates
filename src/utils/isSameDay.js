import compareDates from './compareDates';

export default function isSameDay(a, b) {
  return compareDates(a, b) === 0;
}
