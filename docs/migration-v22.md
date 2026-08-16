# Migrating to react-dates v22

v22 targets React 18 and React 19 and removes the legacy runtime styling and
date-object contracts.

## Dates

Replace public date objects with canonical ISO date strings:

```diff
- date={moment('2026-08-16')}
+ date="2026-08-16"
```

The same change applies to `startDate`, `endDate`, `minDate`, `maxDate`, values
returned by `initialVisibleMonth`, and every date supplied to callbacks,
predicates, or render props. Invalid dates and non-canonical strings are rejected.
`toMomentObject` has been removed and no implementation-specific replacement is
provided.

## Formatting

Replace library-specific format tokens with `Intl.DateTimeFormatOptions`:

```diff
- displayFormat="DD/MM/YYYY"
+ displayFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
```

A formatter callback may return a string and receives `(isoDate, context)`, where
`context` contains `locale` and `numberingSystem`. Dates remain
timezone-free and the API does not accept a timezone.

## Styling

Import `react-dates/css` once. Importing `react-dates/initialize` is no longer
required, although it remains a no-op for compatibility. Override existing CSS
selectors or `--react-dates-*` custom properties. Runtime style interface and
theme registration APIs no longer affect components.

## Non-Gregorian calendars

v22 does not provide a `calendar` prop, non-Gregorian projection, or custom
calendar arithmetic. The old `moment-jalaali` Storybook integration was not a
core picker contract and has been removed with Moment. Applications that need a
specialized calendar display can implement it through formatter and render
callbacks while keeping picker values as Gregorian ISO dates.

## Runtime requirements

- React and React DOM 18 or 19
- Node 22.22.2 or newer for development and package tooling
- Evergreen browsers (`>0.5%, not dead, not IE 11`)
