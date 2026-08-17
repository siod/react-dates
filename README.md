# react-dates

Accessible, responsive date pickers for React 18 and React 19.

Version 22 uses Luxon `DateTime` values throughout its public API and ships
static CSS with custom properties for theming. Moment, runtime style
initialization, and non-Gregorian calendar projection are not part of the v22
API.

## Requirements

- React and React DOM 18 or 19
- Luxon 3.7 or newer within major version 3
- An evergreen browser (`>0.5%, not dead`, excluding IE 11)
- Node 22.22.2 or newer when developing or building this repository

## Install

```sh
npm install react-dates luxon
```

Import the stylesheet once near your application entry point:

```js
import 'react-dates/css';
```

`react-dates/initialize` remains available as a harmless compatibility import,
but v22 no longer needs runtime style initialization.

## Quick start

The picker shells are controlled components. Your application owns the selected
date values and whether the calendar is open.

### Single date

```jsx
import { useState } from 'react';
import { DateTime } from 'luxon';
import { SingleDatePicker } from 'react-dates';
import 'react-dates/css';

export default function BookingDate() {
  const [date, setDate] = useState(DateTime.local());
  const [focused, setFocused] = useState(false);

  return (
    <SingleDatePicker
      id="booking-date"
      date={date}
      focused={focused}
      onDateChange={setDate}
      onFocusChange={({ focused: nextFocused }) => setFocused(nextFocused)}
    />
  );
}
```

### Date range

```jsx
import { useState } from 'react';
import { DateRangePicker } from 'react-dates';
import 'react-dates/css';

export default function BookingRange() {
  const [dates, setDates] = useState({ startDate: null, endDate: null });
  const [focusedInput, setFocusedInput] = useState(null);

  return (
    <DateRangePicker
      startDate={dates.startDate}
      startDateId="booking-start-date"
      endDate={dates.endDate}
      endDateId="booking-end-date"
      onDatesChange={setDates}
      focusedInput={focusedInput}
      onFocusChange={setFocusedInput}
    />
  );
}
```

Input IDs must be unique on the page. `focusedInput` is `START_DATE`,
`END_DATE`, or `null`; the picker supplies the appropriate value to
`onFocusChange`. These constants are exported from `react-dates/constants`.

More controlled wrappers are available in the [examples directory](examples),
with interactive configurations in [Storybook](stories).

## Date values

All public date values are valid Luxon `DateTime` instances or `null`. Luxon is a
peer dependency, so applications construct, inspect, and transform picker values
with the same API the components use internally.

The representation applies to `date`, `startDate`, `endDate`, `minDate`, and
`maxDate`, as well as values passed to predicates, render callbacks, formatter
callbacks, `initialVisibleMonth`, and change handlers. Strings, invalid
DateTimes, Moment values, and native `Date` objects are not accepted at these
boundaries.

Calendar-day comparisons use each value's local date. Luxon arithmetic is
immutable and preserves the value's zone.

```js
import { DateTime } from 'luxon';
import { isSameDay } from 'react-dates';

const firstBookableDate = DateTime.now().setZone('Australia/Brisbane').startOf('day');

const dateRuleProps = {
  minDate: firstBookableDate,
  isDayHighlighted: (day) => isSameDay(day, firstBookableDate),
};
```

Spread `dateRuleProps` onto either picker alongside the required controlled
props shown above.

## Formatting and localization

Formatting props accept `Intl.DateTimeFormatOptions` or a callback that receives
a `DateTime` and returns a string:

```js
import { Settings } from 'luxon';

Settings.defaultLocale = 'en-AU';

const formattingProps = {
  displayFormat: { day: '2-digit', month: 'short', year: 'numeric' },
  monthFormat: { month: 'long', year: 'numeric' },
  dayAriaLabelFormat: (day) => day.toLocaleString({ dateStyle: 'full' }),
};
```

Spread `formattingProps` onto either picker.

The picker uses each `DateTime`'s locale and falls back to
`Settings.defaultLocale` for empty state and typed-input parsing. A supplied
value can override the default with `dateTime.setLocale(...)`.

Formatting and calendar arithmetic are Gregorian. `isRTL` controls layout
direction. A value's Luxon zone is preserved; there are no separate picker
locale, timezone, calendar, or numbering-system props.

## Styling

The distributed CSS preserves the established `.DateInput`, `.CalendarDay`, and
other component selectors. Import application overrides after the library CSS.
Theme values can be changed through `--react-dates-*` custom properties:

```css
:root {
  --react-dates-primary: #006c67;
  --react-dates-primary-dark: #00514d;
  --react-dates-color-hovered-span-background: #d8f3f0;
  --react-dates-sizing-input-width: 145px;
}
```

The complete set of defaults is defined in
[`src/internal/styles/variables.css`](src/internal/styles/variables.css).
Selector-level overrides remain supported where a custom property is not
available.

The JavaScript `DefaultTheme` deep import remains as a compatibility reference.
Custom `react-with-styles` interface or theme registration no longer changes
rendered components.

## Components and imports

Most applications should use `SingleDatePicker` or `DateRangePicker`. The root
package also exports lower-level input, calendar, and controller components for
applications that need to compose their own picker shell.

Supported package entry points include:

- `react-dates`
- `react-dates/constants`
- `react-dates/initialize`
- `react-dates/css`
- `react-dates/lib/css/_datepicker.css`
- Existing `lib` and `esm` deep component imports

The component prop contracts are maintained in
[`SingleDatePickerShape`](src/shapes/SingleDatePickerShape.js) and
[`DateRangePickerShape`](src/shapes/DateRangePickerShape.js). Constants such as
orientations, focus targets, navigation positions, and default formatting
options are available from `react-dates/constants`.

## Migrating from v21

See [the v22 migration guide](docs/migration-v22.md) for the Moment-to-Luxon,
formatting, styling, and runtime changes. The
[modernization plan](REACT_18_MODERNIZATION_PLAN.md) records the design rationale
and dependency replacements.

## Development

Install the locked dependencies and start Storybook:

```sh
npm ci
npm run storybook
```

The main verification commands are:

```sh
npm run lint
npm test
npm run test:coverage
npm run test:browser
npm run check:deps
npm run build
npm run build:storybook
```

Unit tests run in React Strict Mode and fail on unexpected console warnings or
unhandled runtime errors. Playwright covers Chromium, Firefox, and WebKit, with
deterministic visual snapshots in Chromium. CI verifies React 18 and React 19 on
Node 22 and Node 24 and tests the packed CommonJS and ESM consumers in isolation.

## License

[MIT](LICENSE)
