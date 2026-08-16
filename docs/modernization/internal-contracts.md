# Frozen Internal Contracts

These interfaces are owned by the Sol lead. Workers may implement them but must not change their signatures without an integration review.

## Date adapter

Inputs and outputs are valid Luxon `DateTime` instances or `null`. Components use
Luxon values directly; this module centralizes only shared validation,
calendar-grid generation, locale week rules, and localized input/output behavior.

- `isDateTime(value): boolean`
- `compareDates(left, right): -1 | 0 | 1 | null`
- `startOfWeek(date, options): DateTime | null`
- `endOfWeek(date, options): DateTime | null`
- `getCalendarMonthWeeks(month, options): Array<Array<DateTime | null>>`
- `formatDate(date, options): string`
- `parseLocalizedDate(value, options): DateTime | null`
- `getMonthLabel(date, options): string`
- `getWeekdayLabels(options): string[]`

Formatting options use `locale` and Gregorian `Intl.DateTimeFormatOptions`.
Arithmetic is immutable Luxon arithmetic and preserves the input DateTime's zone.

## Browser helpers

- Portal containers are created lazily in effects, never during module evaluation, and removed only by the instance that created them.
- Event subscriptions return an idempotent cleanup function and retain stable listener references.
- Animation-frame and throttle helpers expose cancellation and are safe after unmount.
- Touch detection guards all browser globals and uses coarse-pointer media queries plus `navigator.maxTouchPoints`.
- Class merging accepts strings and falsey values and returns a deterministic space-separated string.

## Component boundary

- Public date props, callbacks, predicates, and render props use `DateTime | null` exclusively.
- Format props accept `Intl.DateTimeFormatOptions` or `(dateTime, context) => string`.
- The top-level `locale` value flows to every default formatter.
- Components may use Luxon directly and depend on the adapter only for shared locale/calendar behavior.
- Shared shapes, constants, public exports, package metadata, and the global CSS entrypoint remain lead-owned integration surfaces.
