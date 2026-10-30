# react-dates <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![Build Status][ci-svg]][ci-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

> An easily internationalizable, accessible, mobile-friendly datepicker library for the web.

![react-dates in action](https://raw.githubusercontent.com/siod/react-dates/HEAD/react-dates-demo.gif)

This is a maintained fork of Airbnb's [`react-dates`](https://github.com/react-dates/react-dates), published as `@siod/react-dates`. Version 22 targets React 18 and React 19 and uses Luxon `DateTime` values instead of Moment. See the [v22 migration guide](docs/migration-v22.md) when upgrading from the original package and the [v23 migration guide](docs/migration-v23.md) for the TypeScript-first API.

## Live Playground

For examples of the datepicker in action, go to [siod.github.io/react-dates](https://siod.github.io/react-dates/).

OR

To run that demo on your own computer:
* Clone this repository
* `npm ci`
* `npm run storybook`
* Visit http://localhost:6006/

## Getting Started
### Install dependencies
Install `react-dates` and its Luxon peer dependency:

```sh
npm install --save @siod/react-dates luxon
```

Your application must provide React and React DOM 18 or 19.

### Initialize
Import the stylesheet once near your application entry point:

```js
import '@siod/react-dates/css';
```

The `initialize` compatibility entrypoint in `react-dates` remains available as a harmless no-op, but v22 no longer requires runtime style initialization.

Note: This component assumes `box-sizing: border-box` is set globally in your page's CSS.

### Include component
```js
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from '@siod/react-dates';
```

#### Webpack
Using Webpack with CSS loader, add the following import to your app:
```js
import '@siod/react-dates/css';
```

#### Without Webpack:
Create a CSS file with the contents of `require.resolve('@siod/react-dates/css')` and include it in your html `<head>` section.

To see complete controlled examples, explore the [examples folder](examples).

#### Overriding styles
The easiest way to tweak `react-dates` to your heart's content is to create another stylesheet to override the default react-dates styles. Import your overrides after the react-dates stylesheet. Theme values can also be overridden with CSS variables:

```css
:root {
  --react-dates-primary: #006c67;
  --react-dates-primary-dark: #00514d;
}

/* Will edit everything selected including everything between a range of dates. */
.CalendarDay__selected_span {
  background: #82e0aa;
  color: white;
  border-color: #58d68d;
}

/* Will edit selected date or the endpoints of a range of dates. */
.CalendarDay__selected {
  background: #186a3b;
  color: white;
}

/* Will edit when hovered over. _span style also has this property. */
.CalendarDay__selected:hover {
  background: orange;
  color: white;
}

/* Will edit when the end date in a range has not yet been selected. */
.CalendarDay__hovered_span:hover,
.CalendarDay__hovered_span {
  background: brown;
}
```

This would override the background and text colors applied to highlighted calendar days. You can use this method with the default set-up to override any aspect of the calendar to have it better fit to your particular needs. If there are any styles that you need that aren't listed here, you can always check the source CSS of each element and the [CSS variable defaults](src/internal/styles/variables.css).

### Make some awesome datepickers

The public components are controlled React components. Their prop types and shared callback types are exported from the package root, and the [TypeScript example](examples/TypeScriptUsage.tsx) is checked by the repository's `typecheck` script.

#### JavaScript

A `DateRangePicker` needs the selected dates, stable input IDs, the focused input, and change handlers:

```jsx
import { useState } from 'react';
import { DateRangePicker } from '@siod/react-dates';

export function BookingDates() {
  const [dates, setDates] = useState({ startDate: null, endDate: null });
  const [focusedInput, setFocusedInput] = useState(null);

  return (
    <DateRangePicker
      startDate={dates.startDate}
      startDateId="booking-start-date"
      endDate={dates.endDate}
      endDateId="booking-end-date"
      focusedInput={focusedInput}
      onDatesChange={setDates}
      onFocusChange={setFocusedInput}
    />
  );
}
```

A `SingleDatePicker` follows the same controlled pattern with `date`, `focused`, `onDateChange`, and `onFocusChange`.

#### TypeScript

Import public types from the package root rather than copying prop shapes:

```tsx
import { useState } from 'react';
import { DateTime } from 'luxon';
import {
  SingleDatePicker,
  type SingleDatePickerProps,
} from '@siod/react-dates';

export function DepartureDate() {
  const [date, setDate] = useState<DateTime | null>(null);
  const [focused, setFocused] = useState(false);

  const handleFocusChange: SingleDatePickerProps['onFocusChange'] = ({
    focused: nextFocused,
  }) => setFocused(nextFocused);

  return (
    <SingleDatePicker
      id="departure-date"
      date={date}
      focused={focused}
      onDateChange={setDate}
      onFocusChange={handleFocusChange}
    />
  );
}
```

The main exported prop types are:

- `DateRangePickerProps` and `SingleDatePickerProps`
- `DayPickerRangeControllerProps` and `DayPickerSingleDateControllerProps`
- `DayPickerProps`, `CalendarDayProps`, `CalendarMonthProps`, and the input component prop types

Common supporting types include `DateRange`, `FocusedInput`, `DateFormat`, `DatePredicate`, `DayRenderer`, and phrase interfaces. Dates are valid Luxon `DateTime` values or `null`. `FocusedInput` is `'startDate' | 'endDate' | null`. Formatting props accept either `Intl.DateTimeFormatOptions` or a callback receiving a `DateTime`.

Use `renderMonthText` or `renderMonthElement`, not both; the exported picker types model that constraint. See [`src/types.ts`](src/types.ts) for the complete source contract and the [live demo](https://siod.github.io/react-dates/) for component behavior.

## Localization

[Luxon](https://moment.github.io/luxon/) is a peer dependency of `react-dates`. Set its default locale in the component where Luxon is imported:

```js
import { DateTime, Settings } from 'luxon';

Settings.defaultLocale = 'pl'; // Polish

const selectedDate = DateTime.fromISO('2026-08-17').setLocale('en-AU');
```

Values supplied to the picker must be valid Luxon `DateTime` instances, such as `selectedDate` above. Calling the immutable `setLocale(...)` method on an individual value overrides the global default for that value. The picker preserves each value's Luxon zone and does not add separate locale or timezone props.

However, this only solves date localization. For complete internationalization of the components, `react-dates` defines a certain amount of [user interface strings](src/defaultPhrases.js) in English which can be changed through the `phrases` prop. For accessibility and usability concerns, **all these UI elements should be translated**.

Formatting props accept `Intl.DateTimeFormatOptions` or a callback receiving a `DateTime`. Formatting and calendar arithmetic are Gregorian. `isRTL` controls layout direction; there are no separate calendar or numbering-system props.

## Advanced

### Theming
Version 22 uses static CSS and `--react-dates-*` custom properties. The old `react-with-styles` interface and runtime theme registration APIs no longer affect rendered components. Import overrides after the react-dates stylesheet:

```css
:root {
  --react-dates-primary: #006c67;
  --react-dates-color-highlighted-background: #82e0aa;
  --react-dates-color-highlighted-background-active: #58d68d;
  --react-dates-color-highlighted-color: #186a3b;
}
```

`CustomizableCalendarDay` uses the same custom properties for its default style props. Explicit values passed through its style props continue to override those defaults.

[package-url]: https://www.npmjs.com/package/@siod/react-dates
[npm-version-svg]: https://img.shields.io/npm/v/%40siod%2Freact-dates.svg
[ci-svg]: https://github.com/siod/react-dates/actions/workflows/ci-modernization.yml/badge.svg
[ci-url]: https://github.com/siod/react-dates/actions/workflows/ci-modernization.yml
[license-image]: https://img.shields.io/npm/l/react-dates.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/%40siod%2Freact-dates.svg
[downloads-url]: https://www.npmjs.com/package/@siod/react-dates
