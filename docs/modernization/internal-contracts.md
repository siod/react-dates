# Frozen Internal Contracts

These interfaces are owned by the Sol lead. Workers may implement them but must not change their signatures without an integration review.

## Date adapter

All inputs and outputs are canonical `YYYY-MM-DD` strings or `null`. No Luxon object crosses this boundary.

- `isCanonicalDate(value): boolean`
- `parseDate(value): string | null`
- `compareDates(left, right): -1 | 0 | 1 | null`
- `addDays(date, amount): string | null`
- `addMonths(date, amount): string | null`
- `startOfMonth(date): string | null`
- `endOfMonth(date): string | null`
- `startOfWeek(date, options): string | null`
- `getCalendarMonthWeeks(month, options): string[][]`
- `formatDate(date, options): string`
- `parseLocalizedDate(value, options): string | null`
- `getMonthLabel(date, options): string`
- `getWeekdayLabels(options): string[]`

Formatting options use `locale`, `numberingSystem`, and Gregorian `Intl.DateTimeFormatOptions`. Date arithmetic always uses UTC date-only semantics.

## Browser helpers

- Portal containers are created lazily in effects, never during module evaluation, and removed only by the instance that created them.
- Event subscriptions return an idempotent cleanup function and retain stable listener references.
- Animation-frame and throttle helpers expose cancellation and are safe after unmount.
- Touch detection guards all browser globals and uses coarse-pointer media queries plus `navigator.maxTouchPoints`.
- Class merging accepts strings and falsey values and returns a deterministic space-separated string.

## Component boundary

- Public date props, callbacks, predicates, and render props use `YYYY-MM-DD | null` exclusively.
- Format props accept `Intl.DateTimeFormatOptions` or `(isoDate, context) => string`.
- Top-level `locale` and `numberingSystem` values flow to every default formatter.
- Components may depend on the private adapter and browser helpers, never directly on Luxon.
- Shared shapes, constants, public exports, package metadata, and the global CSS entrypoint remain lead-owned integration surfaces.
