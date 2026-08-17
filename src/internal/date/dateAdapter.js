import { DateTime, Info } from 'luxon';
import isDateTime from '../../utils/isDateTime';

// These are deliberately not forwarded to Intl. Dates stay Gregorian and digit
// selection follows the locale. The DateTime's own zone remains authoritative.
const NON_FORMAT_OPTION_NAMES = new Set([
  'locale',
  'calendar',
  'numberingSystem',
  'firstDayOfWeek',
  'enableOutsideDays',
  'weekStartsOn',
]);

function intlOptions(options = {}) {
  const result = {};
  Object.keys(options || {}).forEach((key) => {
    if (!NON_FORMAT_OPTION_NAMES.has(key)) result[key] = options[key];
  });
  result.calendar = 'gregory';
  return result;
}

function hasDateFormat(options) {
  return Object.keys(options).some((key) => key !== 'calendar');
}

function localeFor(options = {}, date = null) {
  return options?.locale || date?.locale || DateTime.local().locale;
}

function firstDayFor(options = {}, date = null) {
  const explicit = options.firstDayOfWeek == null ? options.weekStartsOn : options.firstDayOfWeek;
  if (explicit != null) {
    return Number.isInteger(explicit) && explicit >= 0 && explicit <= 6 ? explicit : null;
  }
  try {
    return Info.getStartOfWeek({ locale: localeFor(options, date) }) % 7;
  } catch (error) {
    return 1;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value) {
  return String(value).replace(/[\u00a0\u202f]/g, ' ').trim().replace(/\s+/g, ' ');
}

function digitMap(locale) {
  try {
    const digits = new Intl.NumberFormat(locale, { useGrouping: false })
      .format(9876543210)
      .split('')
      .reverse();
    return new Map(digits.map((digit, index) => [digit, String(index)]));
  } catch (error) {
    return new Map();
  }
}

function toLatinDigits(value, map) {
  return String(value).split('').map((char) => map.get(char) || char).join('');
}

function monthNameMap(locale, formatterOptions) {
  const map = new Map();
  const requested = formatterOptions.month;
  const lengths = ['long', 'short', 'narrow'].includes(requested)
    ? [requested]
    : ['long', 'short', 'narrow'];
  try {
    lengths.forEach((length) => {
      Info.monthsFormat(length, { locale, outputCalendar: 'gregory' }).forEach((name, index) => {
        const key = normalizeText(name).toLocaleLowerCase(locale);
        const month = index + 1;
        const existing = map.get(key);
        map.set(key, existing === undefined || existing === month ? month : null);
      });
    });
  } catch (error) {
    return new Map();
  }
  return map;
}

export function startOfWeek(date, options = {}) {
  const firstDay = firstDayFor(options || {}, date);
  if (!isDateTime(date) || firstDay == null) return null;
  const distance = (date.weekday % 7 - firstDay + 7) % 7;
  return date.minus({ days: distance }).startOf('day');
}

export function endOfWeek(date, options = {}) {
  const start = startOfWeek(date, options);
  return start ? start.plus({ days: 6 }).endOf('day') : null;
}

export function getFirstDayOfWeek(options = {}) {
  return firstDayFor(options || {});
}

export function formatDate(date, options = {}) {
  if (!isDateTime(date)) return '';
  const formatOptions = intlOptions(options);
  if (!hasDateFormat(formatOptions)) formatOptions.dateStyle = 'short';
  return date.toLocaleString(formatOptions, {
    locale: localeFor(options, date),
    outputCalendar: 'gregory',
  });
}

export function parseLocalizedDate(value, options = {}) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const locale = localeFor(options);
  const iso = DateTime.fromISO(value.trim(), { locale });
  if (iso.isValid && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return iso;

  const formatterOptions = intlOptions(options);
  if (!hasDateFormat(formatterOptions)) formatterOptions.dateStyle = 'short';
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat(locale, formatterOptions);
  } catch (error) {
    return null;
  }

  const sample = formatter.formatToParts(DateTime.local(2006, 7, 8).toJSDate());
  const fields = [];
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
  const projected = {};
  fields.forEach((field, index) => {
    const raw = normalizeText(match[index + 1]);
    const numeric = Number(toLatinDigits(raw, digits));
    projected[field] = field === 'month' && Number.isNaN(numeric)
      ? names.get(raw.toLocaleLowerCase(locale)) || null
      : Number.isNaN(numeric) ? null : numeric;
  });
  if (![projected.year, projected.month, projected.day].every(Number.isInteger)) return null;

  const year = projected.year < 100 ? 2000 + projected.year : projected.year;
  const candidate = DateTime.fromObject({ year, month: projected.month, day: projected.day }, { locale });
  return candidate.isValid ? candidate : null;
}

export function getWeekdayLabels(options = {}, formatter = null) {
  const firstDay = firstDayFor(options || {});
  if (firstDay == null) return [];
  const locale = localeFor(options);
  const formatOptions = { weekday: 'short', ...options };
  if (typeof formatter !== 'function') {
    const length = ['long', 'short', 'narrow'].includes(formatOptions.weekday)
      ? formatOptions.weekday
      : 'short';
    try {
      const weekdays = Info.weekdaysFormat(length, { locale });
      return Array.from({ length: 7 }, (_, index) => {
        const sundayIndex = (firstDay + index) % 7;
        return weekdays[(sundayIndex + 6) % 7];
      });
    } catch (error) {
      return [];
    }
  }
  return Array.from({ length: 7 }, (_, index) => {
    const sunday = DateTime.local(2021, 8, 1)
      .setLocale(locale)
      .plus({ days: (firstDay + index) % 7 });
    return formatter(sunday);
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
