# react-dates

Accessible, responsive date pickers for React 18 and React 19.

## Install

```sh
npm install react-dates luxon react react-dom
```

Import the stylesheet once in your application:

```js
import 'react-dates/css';
```

`react-dates/initialize` remains available as a harmless compatibility import,
but v22 no longer needs runtime style initialization.

## Date values

All public date values are valid Luxon `DateTime` instances or `null`. Luxon is a
peer dependency, so applications construct, inspect, and transform picker values
with the same API the components use internally.

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

`DateRangePicker` uses the same representation for `startDate` and `endDate`.
Predicates such as `isOutsideRange`, render callbacks, formatter callbacks, and
`initialVisibleMonth` also receive or return `DateTime` instances. Calendar-day
comparisons use each value's local date; Luxon arithmetic preserves its zone.

## Formatting and localization

Formatting props accept `Intl.DateTimeFormatOptions` or a callback that receives
a `DateTime`:

```jsx
import { Settings } from 'luxon';

Settings.defaultLocale = 'en-AU';

<SingleDatePicker
  displayFormat={{ day: '2-digit', month: 'short', year: 'numeric' }}
  monthFormat={{ month: 'long', year: 'numeric' }}
/>
```

Formatting always uses the Gregorian calendar. The picker uses each `DateTime`'s
locale and falls back to Luxon's `Settings.defaultLocale` for empty state and
typed-input parsing. `isRTL` controls layout direction. A value's Luxon zone is
preserved; there are no separate picker locale or timezone props.

## Styling

The distributed CSS preserves the established `.DateInput`, `.CalendarDay`, and
other component selectors. Theme values can be overridden with CSS variables:

```css
:root {
  --react-dates-color-primary: #006c67;
  --react-dates-color-primary-shade-1: #00514d;
}
```

The JavaScript `DefaultTheme` deep import remains as a compatibility reference.
Custom `react-with-styles` interface or theme registration no longer changes
rendered components.

## Supported imports

- `react-dates`
- `react-dates/constants`
- `react-dates/initialize`
- `react-dates/css`
- `react-dates/lib/css/_datepicker.css`
- Existing `lib` and `esm` deep component imports

See [the v22 migration guide](docs/migration-v22.md) for breaking changes and
[the modernization plan](REACT_18_MODERNIZATION_PLAN.md) for design rationale.

## Development

Requires Node 22.22.2 or newer.

```sh
npm ci
npm test
npm run lint
npm run build
npm run build:storybook
```

The project is licensed under the MIT License.
