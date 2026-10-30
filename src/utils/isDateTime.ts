import { DateTime } from 'luxon';

export default function isDateTime(value: unknown): value is DateTime<true> {
  return DateTime.isDateTime(value) && value.isValid;
}
