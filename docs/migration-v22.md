# Migrating to @siod/react-dates v22

`@siod/react-dates` is a maintained fork of Airbnb's `react-dates`. v22 targets
React 18 and React 19, replaces Moment with Luxon, and removes the legacy
runtime styling contract.

## Package name

Replace the original package with the scoped fork:

```sh
npm uninstall react-dates
npm install @siod/react-dates luxon
```

Update JavaScript and stylesheet imports from `react-dates` to
`@siod/react-dates`. For a transitional installation that preserves existing
source imports, npm aliases are also supported:

```sh
npm install react-dates@npm:@siod/react-dates@^22.0.0
```

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

A formatter callback may return a string and receives the `DateTime`. Read its
`locale` and `zoneName` properties when needed. The picker does not add separate
locale or timezone props.

Replace `moment.locale(...)` with Luxon's global default when localizing an empty
picker or typed input:

```diff
- moment.locale('en-AU')
+ Settings.defaultLocale = 'en-AU'
```

An individual Luxon `DateTime` may override that default with, for example,
`DateTime.fromISO('2026-08-17').setLocale('en-AU')`.

## Styling

Import `@siod/react-dates/css` once. Importing
`@siod/react-dates/initialize` is no longer required, although it remains a
no-op for compatibility. Override existing CSS selectors or `--react-dates-*`
custom properties. Runtime style interface and theme registration APIs no
longer affect components. The
`@siod/react-dates/lib/theme/DefaultTheme` deep import has been removed; translate
overrides based on that object to the corresponding CSS custom properties.
`CustomizableCalendarDay` also uses those properties for its default style
props, while explicit style-prop values continue to take precedence.

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
