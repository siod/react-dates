# Frozen Internal Contracts

These interfaces are owned by the Sol lead. Workers may implement them but must not change their signatures without an integration review.

## Date adapter

Inputs and outputs are valid Luxon `DateTime` instances or `null`. Components use
Luxon values directly; this module centralizes only public PropType validation,
locale week rules, and localized input/output behavior.

- `startOfWeek(date, options): DateTime | null`
- `endOfWeek(date, options): DateTime | null`
- `formatDate(date, options): string`
- `parseLocalizedDate(value, options): DateTime | null`
- `getWeekdayLabels(options): string[]`

Formatting uses each DateTime's locale and Gregorian `Intl.DateTimeFormatOptions`;
empty-state parsing and labels fall back to `Settings.defaultLocale`. Arithmetic
is immutable Luxon arithmetic and preserves the input DateTime's zone.

Ordinary DateTime validation, calendar-day comparison, ISO serialization, and
calendar-grid generation live in `src/utils`. Existing utility modules are the
canonical implementations rather than facades over this adapter.

## Browser helpers

- Portal containers are created lazily in effects, never during module evaluation, and removed only by the instance that created them.
- Event subscriptions return an idempotent cleanup function and retain stable listener references.
- Animation-frame and throttle helpers expose cancellation and are safe after unmount.
- Touch detection guards all browser globals and uses coarse-pointer media queries plus `navigator.maxTouchPoints`.
- Class merging accepts strings and falsey values and returns a deterministic space-separated string.

## Component boundary

- Public date props, callbacks, predicates, and render props use `DateTime | null` exclusively.
- Format props accept `Intl.DateTimeFormatOptions` or `(dateTime) => string`.
- There is no picker-specific locale prop; locale comes from DateTime and Luxon settings.
- Components may use Luxon directly and depend on the adapter only for shared localized parsing, formatting, and week rules.
- Shared shapes, constants, public exports, package metadata, and the global CSS entrypoint remain lead-owned integration surfaces.
