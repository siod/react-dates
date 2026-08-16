# Migrating to react-dates v22

v22 targets React 18 and React 19, replaces Moment with Luxon, and removes the
legacy runtime styling contract.

## Dates

Replace Moment values with Luxon `DateTime` values:

```diff
- date={moment('2026-08-16')}
+ date={DateTime.fromISO('2026-08-16')}
```

The same change applies to `startDate`, `endDate`, `minDate`, `maxDate`, values
returned by `initialVisibleMonth`, and every date supplied to callbacks,
predicates, formatter callbacks, or render props. Import `DateTime` from the
`luxon` peer dependency. Invalid DateTimes and strings are rejected.
`toMomentObject` has been removed because public values already expose Luxon's
conversion and formatting APIs.

## Formatting

Replace library-specific format tokens with `Intl.DateTimeFormatOptions`:

```diff
- displayFormat="DD/MM/YYYY"
+ displayFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
```

A formatter callback may return a string and receives `(dateTime, context)`, where
`context` contains `locale`. The picker preserves each DateTime's zone and does
not add a second timezone prop.

## Styling

Import `react-dates/css` once. Importing `react-dates/initialize` is no longer
required, although it remains a no-op for compatibility. Override existing CSS
selectors or `--react-dates-*` custom properties. Runtime style interface and
theme registration APIs no longer affect components.

## Non-Gregorian calendars

v22 does not provide a `calendar` prop, non-Gregorian projection, or custom
calendar arithmetic. The old third-party non-Gregorian Storybook integration
was not a core picker contract and has been removed with Moment. Applications
that need a specialized calendar display can implement it through formatter and
render callbacks while picker arithmetic remains Gregorian.

## Runtime requirements

- React and React DOM 18 or 19
- Luxon 3.7 or newer within major version 3
- Node 22.22.2 or newer for development and package tooling
- Evergreen browsers (`>0.5%, not dead, not IE 11`)
