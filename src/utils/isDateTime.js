import { DateTime } from 'luxon';

export default function isDateTime(value) {
  return DateTime.isDateTime(value) && value.isValid;
}
