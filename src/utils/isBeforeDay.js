import compareDates from './compareDates';

export default function isBeforeDay(a, b) {
  return compareDates(a, b) === -1;
}
