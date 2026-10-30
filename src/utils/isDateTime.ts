import { DateTime } from 'luxon';

export default function isDateTime(value: unknown): value is DateTime {
  return DateTime.isDateTime(value) && value.isValid;
}
