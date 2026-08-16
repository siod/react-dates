import { DateTime } from 'luxon';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CUSTOM_OPTION_NAMES = new Set([
  'locale',
  'calendar',
  'numberingSystem',
  'firstDayOfWeek',
  'enableOutsideDays',
  'weekStartsOn',
]);

function intlOptions(options = {}) {
  options = options || {};
  const result = {};
  Object.keys(options || {}).forEach((key) => {
    if (!CUSTOM_OPTION_NAMES.has(key)) result[key] = options[key];
  });
  if (options.calendar != null) result.calendar = options.calendar;
  if (options.numberingSystem != null) result.numberingSystem = options.numberingSystem;
  result.timeZone = 'UTC';
  return result;
}

function localeFor(options = {}) {
  return options && options.locale ? options.locale : undefined;
}

function dateTimeFor(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const [, year, month, day] = DATE_RE.exec(value);
  const date = DateTime.fromObject({
    year: Number(year),
    month: Number(month),
    day: Number(day),
  }, { zone: 'utc' });
  return date.isValid && date.toISODate() === value ? date : null;
}

function asInteger(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)
    ? value
    : null;
}

function firstDayFor(options = {}) {
  options = options || {};
  const explicit = options.firstDayOfWeek == null ? options.weekStartsOn : options.firstDayOfWeek;
  if (explicit != null) {
    if (!Number.isInteger(explicit) || explicit < 0 || explicit > 6) return null;
    return explicit;
  }

  // Intl.Locale.weekInfo is supported by current browsers and Node. The
  // fallback is the ISO/Monday convention used by most locales.
  try {
    const locale = new Intl.Locale(options.locale || 'en-US');
    const info = locale.weekInfo || locale.getWeekInfo();
    return info.firstDay % 7;
  } catch (error) {
    return 1;
  }
}

function toDate(value) {
  const date = dateTimeFor(value);
  return date ? date.toJSDate() : null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value) {
  return String(value).replace(/[\u00a0\u202f]/g, ' ').trim().replace(/\s+/g, ' ');
}

function digitMap(locale, numberingSystem) {
  try {
    const formatter = new Intl.NumberFormat(locale, { numberingSystem, useGrouping: false });
    const digits = formatter.format(9876543210).split('').reverse();
    return new Map(digits.map((digit, index) => [digit, String(index)]));
  } catch (error) {
    return new Map();
  }
}

function toLatinDigits(value, map) {
  return String(value).split('').map((char) => map.get(char) || char).join('');
}

function monthNameMap(locale, options, formatterOptions) {
  const map = new Map();
  const monthOptions = formatterOptions.month
    ? [formatterOptions.month]
    : ['long', 'short', 'narrow'];
  const componentOptions = { ...formatterOptions };
  delete componentOptions.dateStyle;
  delete componentOptions.timeStyle;
  delete componentOptions.timeZone;
  const textFormatters = monthOptions.map((month) => new Intl.DateTimeFormat(locale, {
    ...componentOptions,
    month,
    day: undefined,
    year: undefined,
    timeZone: 'UTC',
  }));
  const numericFormatter = new Intl.DateTimeFormat(locale, {
    ...componentOptions,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const mapDigits = digitMap(locale, numericFormatter.resolvedOptions().numberingSystem);
  for (let index = 0; index < 370; index += 1) {
    const date = DateTime.utc(2024, 1, 1).plus({ days: index }).toJSDate();
    const numericPart = numericFormatter.formatToParts(date).find((item) => item.type === 'month');
    if (!numericPart) continue;
    const month = Number(toLatinDigits(numericPart.value, mapDigits));
    textFormatters.forEach((textFormatter) => {
      const textPart = textFormatter.formatToParts(date).find((item) => item.type === 'month');
      if (!textPart) return;
      const key = normalizeText(textPart.value).toLocaleLowerCase(locale);
      const existing = map.get(key);
      map.set(key, existing === undefined || existing === month ? month : null);
    });
  }
  return map;
}

function projectedCalendarPartsFromDate(date, options = {}) {
  const projectionOptions = intlOptions(options);
  delete projectionOptions.year;
  delete projectionOptions.month;
  delete projectionOptions.day;
  delete projectionOptions.dateStyle;
  delete projectionOptions.timeStyle;
  const formatter = new Intl.DateTimeFormat(localeFor(options), {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...projectionOptions,
  });
  const parts = formatter.formatToParts(date);
  const values = {};
  parts.forEach(({ type, value }) => {
    if (type === 'year' || type === 'month' || type === 'day' || type === 'era') {
      values[type] = value;
    }
  });
  const map = digitMap(localeFor(options), formatter.resolvedOptions().numberingSystem);
  const year = Number(toLatinDigits(values.year, map));
  const month = Number(toLatinDigits(values.month, map));
  const day = Number(toLatinDigits(values.day, map));
  return {
    year: Number.isNaN(year) ? values.year : year,
    month: Number.isNaN(month) ? values.month : month,
    day: Number.isNaN(day) ? values.day : day,
    ...(values.era ? { era: values.era } : {}),
  };
}

export function isCanonicalDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  return dateTimeFor(value) !== null;
}

export function parseDate(value) {
  return isCanonicalDate(value) ? value : null;
}

export function compareDates(left, right) {
  if (!isCanonicalDate(left) || !isCanonicalDate(right)) return null;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function addDays(date, amount) {
  const parsed = dateTimeFor(date);
  const count = asInteger(amount);
  if (!parsed || count == null) return null;
  const result = parsed.plus({ days: count });
  return result.isValid ? result.toISODate() : null;
}

export function addMonths(date, amount) {
  const parsed = dateTimeFor(date);
  const count = asInteger(amount);
  if (!parsed || count == null) return null;
  const result = parsed.plus({ months: count });
  return result.isValid ? result.toISODate() : null;
}

export function addWeeks(date, amount) {
  const count = asInteger(amount);
  return count == null ? null : addDays(date, count * 7);
}

export function addYears(date, amount) {
  const parsed = dateTimeFor(date);
  const count = asInteger(amount);
  if (!parsed || count == null) return null;
  const result = parsed.plus({ years: count });
  return result.isValid ? result.toISODate() : null;
}

export function today() {
  return DateTime.local().toISODate();
}

export function startOfMonth(date) {
  const parsed = dateTimeFor(date);
  return parsed ? parsed.startOf('month').toISODate() : null;
}

export function endOfMonth(date) {
  const parsed = dateTimeFor(date);
  return parsed ? parsed.endOf('month').toISODate() : null;
}

export function startOfWeek(date, options = {}) {
  const parsed = dateTimeFor(date);
  const firstDay = firstDayFor(options);
  if (!parsed || firstDay == null) return null;
  const sundayIndex = parsed.weekday % 7;
  const distance = (sundayIndex - firstDay + 7) % 7;
  return parsed.minus({ days: distance }).toISODate();
}

export function endOfWeek(date, options = {}) {
  const start = startOfWeek(date, options);
  return start ? addDays(start, 6) : null;
}

// Small ISO-only accessors used by the component migration. They intentionally
// return primitives and never expose a Luxon DateTime.
export function getDateParts(date) {
  if (!isCanonicalDate(date)) return null;
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) };
}

export function getDayOfMonth(date) {
  const parts = getDateParts(date);
  return parts ? parts.day : null;
}

export function getMonth(date) {
  const parts = getDateParts(date);
  return parts ? parts.month : null;
}

export function getYear(date) {
  const parts = getDateParts(date);
  return parts ? parts.year : null;
}

export function getWeekday(date) {
  const parsed = dateTimeFor(date);
  return parsed ? parsed.weekday % 7 : null;
}

export function getFirstDayOfWeek(options = {}) {
  return firstDayFor(options);
}

export function setWeekday(date, weekday) {
  const parsed = dateTimeFor(date);
  const value = asInteger(weekday);
  if (!parsed || value == null || value < 0 || value > 6) return null;
  return parsed.plus({ days: value - (parsed.weekday % 7) }).toISODate();
}

export function setMonth(date, month) {
  const parsed = dateTimeFor(date);
  const value = asInteger(month);
  if (!parsed || value == null || value < 1 || value > 12) return null;
  const result = parsed.set({ month: value });
  return result.isValid ? result.toISODate() : null;
}

export function setDayOfMonth(date, day) {
  const parsed = dateTimeFor(date);
  const value = asInteger(day);
  if (!parsed || value == null || value < 1 || value > 31) return null;
  const result = parsed.set({ day: value });
  return result.isValid ? result.toISODate() : null;
}

export function setYear(date, year) {
  const parsed = dateTimeFor(date);
  const value = asInteger(year);
  if (!parsed || value == null) return null;
  const result = parsed.set({ year: value });
  return result.isValid ? result.toISODate() : null;
}

export function diffDays(left, right) {
  const a = dateTimeFor(left);
  const b = dateTimeFor(right);
  return a && b ? Math.trunc(a.diff(b, 'days').days) : null;
}

export function diffMonths(left, right) {
  const a = dateTimeFor(left);
  const b = dateTimeFor(right);
  return a && b ? Math.trunc(a.diff(b, 'months').months) : null;
}

export function isSameUnit(left, right, unit) {
  if (!isCanonicalDate(left) || !isCanonicalDate(right)) return false;
  if (unit === 'day') return left === right;
  if (unit === 'month') return left.slice(0, 7) === right.slice(0, 7);
  if (unit === 'year') return left.slice(0, 4) === right.slice(0, 4);
  return false;
}

export function isBetween(date, start, end, { inclusive = false } = {}) {
  const lower = compareDates(date, start);
  const upper = compareDates(date, end);
  if (lower == null || upper == null) return false;
  return inclusive ? lower >= 0 && upper <= 0 : lower > 0 && upper < 0;
}

export function getCalendarMonthWeeks(month, options = {}) {
  options = options || {};
  const parsed = dateTimeFor(month);
  const firstDay = firstDayFor(options);
  if (!parsed || firstDay == null) return [];
  const outside = Boolean(options.enableOutsideDays);
  const first = parsed.startOf('month');
  const last = parsed.endOf('month');
  const before = (first.weekday % 7 - firstDay + 7) % 7;
  const after = (firstDay + 6 - (last.weekday % 7) + 7) % 7;
  const start = first.minus({ days: before });
  const total = before + last.day + after;
  const weeks = [];
  for (let index = 0; index < total; index += 1) {
    if (index % 7 === 0) weeks.push([]);
    const current = start.plus({ days: index });
    const inMonth = current.year === first.year && current.month === first.month;
    weeks[weeks.length - 1].push((outside || inMonth) ? current.toISODate() : null);
  }
  return weeks;
}

export function formatDate(date, options = {}) {
  const jsDate = toDate(date);
  if (!jsDate) return '';
  const formatOptions = intlOptions(options);
  if (Object.keys(formatOptions).length === 1) formatOptions.dateStyle = 'short';
  return new Intl.DateTimeFormat(localeFor(options), formatOptions).format(jsDate);
}

export function parseLocalizedDate(value, options = {}) {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (isCanonicalDate(value.trim())) return value.trim();

  const locale = localeFor(options);
  const formatterOptions = intlOptions(options);
  if (Object.keys(formatterOptions).length === 1) formatterOptions.dateStyle = 'short';
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat(locale, formatterOptions);
  } catch (error) {
    return null;
  }

  // Derive the input grammar from Intl itself, keeping literals (including
  // locale-specific punctuation and bidi marks) in the same order.
  const sample = formatter.formatToParts(DateTime.utc(2006, 7, 8).toJSDate());
  const fields = [];
  const pattern = sample.map((part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      fields.push(part.type);
      return '(.+?)';
    }
    return escapeRegExp(part.value).replace(/\\ /g, '\\s*');
  }).join('');
  const match = new RegExp(`^\\s*${pattern}\\s*$`, 'iu').exec(value);
  if (!match) {
    return null;
  }

  const resolved = formatter.resolvedOptions();
  const map = digitMap(locale, resolved.numberingSystem);
  const names = monthNameMap(locale, options, formatterOptions);
  const projected = {};
  let capture = 1;
  fields.forEach((field) => {
    const raw = normalizeText(match[capture]);
    const numeric = Number(toLatinDigits(raw, map));
    if (field === 'month' && Number.isNaN(numeric)) {
      projected.month = names.get(raw.toLocaleLowerCase(locale)) || null;
    } else {
      projected[field] = Number.isNaN(numeric) ? null : numeric;
    }
    capture += 1;
  });
  if (![projected.year, projected.month, projected.day].every((part) => Number.isInteger(part))) {
    return null;
  }

  const calendar = resolved.calendar;
  if (calendar === 'gregory' || calendar === 'iso8601') {
    const year = projected.year < 100 ? 2000 + projected.year : projected.year;
    const candidate = DateTime.fromObject({ year, month: projected.month, day: projected.day }, { zone: 'utc' });
    return candidate.isValid ? candidate.toISODate() : null;
  }

  // Intl formats non-Gregorian calendars but does not expose a calendar-date
  // parser. Search the nearby Gregorian year (calendar eras are short enough
  // that this remains bounded) and compare the projected parts.
  const approximateYear = projected.year + (calendar === 'persian' ? 621 : 0);
  const start = DateTime.utc(approximateYear, 1, 1).minus({ days: 450 });
  for (let index = 0; index <= 900; index += 1) {
    const candidate = start.plus({ days: index });
    const parts = projectedCalendarPartsFromDate(candidate.toJSDate(), options);
    if (parts.year === projected.year && parts.month === projected.month && parts.day === projected.day) {
      return candidate.toISODate();
    }
  }
  return null;
}

export function getMonthLabel(date, options = {}) {
  return formatDate(date, { month: 'long', year: 'numeric', ...options });
}

export function getWeekdayLabels(options = {}, formatter = null) {
  const firstDay = firstDayFor(options);
  if (firstDay == null) return [];
  const formatOptions = { weekday: 'short', ...options };
  const context = {
    locale: options.locale,
    calendar: options.calendar,
    numberingSystem: options.numberingSystem,
  };
  return Array.from({ length: 7 }, (_, index) => {
    const sundayDate = DateTime.utc(2021, 8, 1).plus({ days: (firstDay + index) % 7 }).toISODate();
    return typeof formatter === 'function'
      ? formatter(sundayDate, context)
      : formatDate(sundayDate, formatOptions);
  });
}

export function projectCalendarParts(date, options = {}) {
  const jsDate = toDate(date);
  return jsDate ? projectedCalendarPartsFromDate(jsDate, options) : null;
}

export default {
  isCanonicalDate,
  parseDate,
  compareDates,
  addDays,
  addMonths,
  addWeeks,
  addYears,
  today,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  getDateParts,
  getDayOfMonth,
  getMonth,
  getYear,
  getWeekday,
  getFirstDayOfWeek,
  setWeekday,
  setMonth,
  setDayOfMonth,
  setYear,
  diffDays,
  diffMonths,
  isSameUnit,
  isBetween,
  getCalendarMonthWeeks,
  formatDate,
  parseLocalizedDate,
  getMonthLabel,
  getWeekdayLabels,
  projectCalendarParts,
};
