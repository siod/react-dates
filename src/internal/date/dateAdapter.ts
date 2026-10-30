import { DateTime, Info } from 'luxon';

import isDateTime from '../../utils/isDateTime.js';

export interface DateAdapterOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
  firstDayOfWeek?: number | null;
  enableOutsideDays?: boolean;
  weekStartsOn?: number | null;
}

export type WeekdayFormatter = (date: DateTime<true>) => string;

type DateField = 'year' | 'month' | 'day';

const NON_FORMAT_OPTION_NAMES = new Set([
  'locale',
  'calendar',
  'numberingSystem',
  'firstDayOfWeek',
  'enableOutsideDays',
  'weekStartsOn',
]);

function intlOptions(options: DateAdapterOptions = {}): Intl.DateTimeFormatOptions {
  const result: Intl.DateTimeFormatOptions = {};
  const entries = Object.entries(options as unknown as Record<string, unknown>);
  entries.forEach(([key, value]) => {
    if (!NON_FORMAT_OPTION_NAMES.has(key)) {
      Object.assign(result, { [key]: value });
    }
  });
  result.calendar = 'gregory';
  return result;
}

function hasDateFormat(options: Intl.DateTimeFormatOptions) {
  return Object.keys(options).some((key) => key !== 'calendar');
}

function localeFor(options: DateAdapterOptions = {}, date: DateTime<true> | null = null) {
  return options.locale || date?.locale || DateTime.local().locale;
}

function firstDayFor(
  options: DateAdapterOptions = {},
  date: DateTime<true> | null = null,
): number | null {
  const explicit = options.firstDayOfWeek == null
    ? options.weekStartsOn
    : options.firstDayOfWeek;
  if (explicit != null) {
    return Number.isInteger(explicit) && explicit >= 0 && explicit <= 6 ? explicit : null;
  }
  try {
    return Info.getStartOfWeek({ locale: localeFor(options, date) }) % 7;
  } catch {
    return 1;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: unknown) {
  return String(value).replace(/[\u00a0\u202f]/g, ' ').trim().replace(/\s+/g, ' ');
}

function digitMap(locale: string) {
  try {
    const digits = new Intl.NumberFormat(locale, { useGrouping: false })
      .format(9876543210)
      .split('')
      .reverse();
    return new Map(digits.map((digit, index) => [digit, String(index)]));
  } catch {
    return new Map<string, string>();
  }
}

function toLatinDigits(value: unknown, map: ReadonlyMap<string, string>) {
  return String(value).split('').map((character) => map.get(character) || character).join('');
}

function monthNameMap(locale: string, formatterOptions: Intl.DateTimeFormatOptions) {
  const map = new Map<string, number | null>();
  const requested = formatterOptions.month;
  const allLengths: Array<'long' | 'short' | 'narrow'> = ['long', 'short', 'narrow'];
  const lengths = requested && allLengths.includes(requested as 'long' | 'short' | 'narrow')
    ? [requested as 'long' | 'short' | 'narrow']
    : allLengths;
  try {
    lengths.forEach((length) => {
      Info.monthsFormat(length, { locale, outputCalendar: 'gregory' }).forEach((name, index) => {
        const key = normalizeText(name).toLocaleLowerCase(locale);
        const month = index + 1;
        const existing = map.get(key);
        map.set(key, existing === undefined || existing === month ? month : null);
      });
    });
  } catch {
    return new Map<string, number | null>();
  }
  return map;
}

export function startOfWeek(
  date: DateTime | null | undefined,
  options: DateAdapterOptions = {},
): DateTime<true> | null {
  if (!isDateTime(date)) return null;
  const firstDay = firstDayFor(options, date);
  if (firstDay == null) return null;
  const distance = (date.weekday % 7 - firstDay + 7) % 7;
  return date.minus({ days: distance }).startOf('day');
}

export function endOfWeek(
  date: DateTime | null | undefined,
  options: DateAdapterOptions = {},
): DateTime<true> | null {
  const start = startOfWeek(date, options);
  return start ? start.plus({ days: 6 }).endOf('day') : null;
}

export function getFirstDayOfWeek(options: DateAdapterOptions = {}) {
  return firstDayFor(options);
}

export function formatDate(
  date: DateTime | null | undefined,
  options: DateAdapterOptions = {},
) {
  if (!isDateTime(date)) return '';
  const formatOptions = intlOptions(options);
  if (!hasDateFormat(formatOptions)) formatOptions.dateStyle = 'short';
  return date.toLocaleString(formatOptions, {
    locale: localeFor(options, date),
    outputCalendar: 'gregory',
  });
}

export function parseLocalizedDate(
  value: string | null | undefined,
  options: DateAdapterOptions = {},
): DateTime<true> | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const locale = localeFor(options);
  const iso = DateTime.fromISO(value.trim(), { locale });
  if (iso.isValid && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return iso;

  const formatterOptions = intlOptions(options);
  if (!hasDateFormat(formatterOptions)) formatterOptions.dateStyle = 'short';
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat(locale, formatterOptions);
  } catch {
    return null;
  }

  const sample = formatter.formatToParts(DateTime.local(2006, 7, 8).toJSDate());
  const fields: DateField[] = [];
  const pattern = sample.map((part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      fields.push(part.type);
      return '(.+?)';
    }
    return escapeRegExp(part.value).replace(/\\ /g, '\\s*');
  }).join('');
  const match = new RegExp(`^\\s*${pattern}\\s*$`, 'iu').exec(value);
  if (!match) return null;

  const digits = digitMap(locale);
  const names = monthNameMap(locale, formatterOptions);
  const projected: Partial<Record<DateField, number | null>> = {};
  fields.forEach((field, index) => {
    const raw = normalizeText(match[index + 1]);
    const numeric = Number(toLatinDigits(raw, digits));
    projected[field] = field === 'month' && Number.isNaN(numeric)
      ? names.get(raw.toLocaleLowerCase(locale)) || null
      : Number.isNaN(numeric) ? null : numeric;
  });
  const { year: projectedYear, month, day } = projected;
  if (![projectedYear, month, day].every(Number.isInteger)) return null;

  const year = (projectedYear as number) < 100
    ? 2000 + (projectedYear as number)
    : projectedYear as number;
  const candidate = DateTime.fromObject({
    year,
    month: month as number,
    day: day as number,
  }, { locale });
  return candidate.isValid ? candidate : null;
}

export function getWeekdayLabels(
  options: DateAdapterOptions = {},
  formatter: WeekdayFormatter | null = null,
) {
  const firstDay = firstDayFor(options);
  if (firstDay == null) return [];
  const locale = localeFor(options);
  const weekday = options.weekday;
  if (!formatter) {
    const length = weekday === 'long' || weekday === 'narrow' ? weekday : 'short';
    try {
      const weekdays = Info.weekdaysFormat(length, { locale });
      return Array.from({ length: 7 }, (_, index) => {
        const sundayIndex = (firstDay + index) % 7;
        return weekdays[(sundayIndex + 6) % 7];
      });
    } catch {
      return [];
    }
  }
  return Array.from({ length: 7 }, (_, index) => {
    const sunday = DateTime.local(2021, 8, 1)
      .setLocale(locale)
      .plus({ days: (firstDay + index) % 7 });
    return sunday.isValid ? formatter(sunday) : '';
  });
}

export default {
  startOfWeek,
  endOfWeek,
  getFirstDayOfWeek,
  formatDate,
  parseLocalizedDate,
  getWeekdayLabels,
};
