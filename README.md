# react-dates <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![Build Status][ci-svg]][ci-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

> An easily internationalizable, accessible, mobile-friendly datepicker library for the web.

![react-dates in action](https://raw.githubusercontent.com/react-dates/react-dates/HEAD/react-dates-demo.gif)

Version 22 targets React 18 and React 19 and uses Luxon `DateTime` values instead of Moment. See the [v22 migration guide](docs/migration-v22.md) when upgrading.

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
npm install --save react-dates luxon
```

Your application must provide React and React DOM 18 or 19.

### Initialize
Import the stylesheet once near your application entry point:

```js
import 'react-dates/css';
```

`react-dates/initialize` remains available as a harmless compatibility import, but v22 no longer requires runtime style initialization.

Note: This component assumes `box-sizing: border-box` is set globally in your page's CSS.

### Include component
```js
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
```

#### Webpack
Using Webpack with CSS loader, add the following import to your app:
```js
import 'react-dates/css';
```

#### Without Webpack:
Create a CSS file with the contents of `require.resolve('react-dates/css')` and include it in your html `<head>` section.

To see complete controlled examples, explore the [examples folder](examples).

#### Overriding styles
The easiest way to tweak `react-dates` to your heart's content is to create another stylesheet to override the default react-dates styles. Import your overrides after the `react-dates` stylesheet. Theme values can also be overridden with CSS variables:

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

We provide a handful of components for your use. If you supply essential props to each component, you'll get a full featured interactive date picker. With additional optional props, you can customize the look and feel of the inputs, calendar, etc. You can see what each of the props do in the [live demo](https://siod.github.io/react-dates/) or explore
how to properly wrap the pickers in the [examples folder](examples).

#### DateRangePicker
The `DateRangePicker` is a fully controlled component that allows users to select a date range. You can control the selected
dates using the `startDate`, `endDate`, and `onDatesChange` props as shown below. The `DateRangePicker` also manages internal
state for partial dates entered by typing (although `onDatesChange` will not trigger until a date has been entered
completely in that case). Similarly, you can control which input is focused as well as calendar visibility (the calendar is
only visible if `focusedInput` is defined) with the `focusedInput` and `onFocusChange` props as shown below.

Here is the minimum *REQUIRED* setup you need to get the `DateRangePicker` working:
```jsx
<DateRangePicker
  startDate={this.state.startDate} // Luxon DateTime or null,
  startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
  endDate={this.state.endDate} // Luxon DateTime or null,
  endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
  onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })} // PropTypes.func.isRequired,
  focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
  onFocusChange={focusedInput => this.setState({ focusedInput })} // PropTypes.func.isRequired,
/>
```

The following is a list of other *OPTIONAL* props you may provide to the `DateRangePicker` to customize appearance and behavior to your heart's desire. All constants (indicated by `ALL_CAPS`) are provided as named exports in `react-dates/constants`. Please explore the [storybook](https://siod.github.io/react-dates/) for more information on what each of these props do.
```js
// input related props
startDatePlaceholderText: PropTypes.string,
endDatePlaceholderText: PropTypes.string,
startDateAriaLabel: PropTypes.string,
endDateAriaLabel: PropTypes.string,
startDateTitleText: PropTypes.string,
endDateTitleText: PropTypes.string,
disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([START_DATE, END_DATE])]),
required: PropTypes.bool,
readOnly: PropTypes.bool,
screenReaderInputMessage: PropTypes.string,
showClearDates: PropTypes.bool,
showDefaultInputIcon: PropTypes.bool,
customInputIcon: PropTypes.node,
customArrowIcon: PropTypes.node,
customCloseIcon: PropTypes.node,
inputIconPosition: PropTypes.oneOf([ICON_BEFORE_POSITION, ICON_AFTER_POSITION]),
noBorder: PropTypes.bool,
block: PropTypes.bool,
small: PropTypes.bool,
regular: PropTypes.bool,
autoComplete: PropTypes.string,

// calendar presentation and interaction related props
renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), // (month) => PropTypes.string,
orientation: PropTypes.oneOf([HORIZONTAL_ORIENTATION, VERTICAL_ORIENTATION]),
anchorDirection: PropTypes.oneOf([ANCHOR_LEFT, ANCHOR_RIGHT]),
openDirection: PropTypes.oneOf([OPEN_DOWN, OPEN_UP]),
horizontalMargin: PropTypes.number,
withPortal: PropTypes.bool,
withFullScreenPortal: PropTypes.bool,
appendToBody: PropTypes.bool,
disableScroll: PropTypes.bool,
daySize: nonNegativeInteger,
isRTL: PropTypes.bool,
initialVisibleMonth: PropTypes.func,
firstDayOfWeek: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6]),
numberOfMonths: PropTypes.number,
keepOpenOnDateSelect: PropTypes.bool,
reopenPickerOnClearDates: PropTypes.bool,
renderCalendarInfo: PropTypes.func,
renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), PropTypes.func, // ({ month, onMonthSelect, onYearSelect, isVisible }) => PropTypes.node,
hideKeyboardShortcutsPanel: PropTypes.bool,
verticalSpacing: PropTypes.number,

// navigation related props
navPrev: PropTypes.node,
navNext: PropTypes.node,
onPrevMonthClick: PropTypes.func,
onNextMonthClick: PropTypes.func,
onClose: PropTypes.func,
transitionDuration: nonNegativeInteger, // milliseconds

// day presentation and interaction related props
renderCalendarDay: PropTypes.func,
renderDayContents: PropTypes.func,
minimumNights: PropTypes.number,
minDate: dateTime,
maxDate: dateTime,
enableOutsideDays: PropTypes.bool,
isDayBlocked: PropTypes.func,
isOutsideRange: PropTypes.func,
isDayHighlighted: PropTypes.func,

// internationalization props
displayFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
monthFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
weekDayFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
phrases: PropTypes.shape(getPhrasePropTypes(DateRangePickerPhrases)),
dayAriaLabelFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
```

#### SingleDatePicker
The `SingleDatePicker` is a fully controlled component that allows users to select a single date. You can control the selected
date using the `date` and `onDateChange` props as shown below. The `SingleDatePicker` also manages internal
state for partial dates entered by typing (although `onDateChange` will not trigger until a date has been entered
completely in that case). Similarly, you can control whether or not the input is focused (calendar visibility is also
controlled with the same props) with the `focused` and `onFocusChange` props as shown below.

Here is the minimum *REQUIRED* setup you need to get the `SingleDatePicker` working:
```jsx
<SingleDatePicker
  date={this.state.date} // Luxon DateTime or null
  onDateChange={date => this.setState({ date })} // PropTypes.func.isRequired
  focused={this.state.focused} // PropTypes.bool
  onFocusChange={({ focused }) => this.setState({ focused })} // PropTypes.func.isRequired
  id="your_unique_id" // PropTypes.string.isRequired,
/>
```

The following is a list of other *OPTIONAL* props you may provide to the `SingleDatePicker` to customize appearance and behavior to your heart's desire. All constants (indicated by `ALL_CAPS`) are provided as named exports in `react-dates/constants`. Please explore the [storybook](https://siod.github.io/react-dates/) for more information on what each of these props do.
```js
// input related props
placeholder: PropTypes.string,
ariaLabel: PropTypes.string,
titleText: PropTypes.string,
disabled: PropTypes.bool,
required: PropTypes.bool,
readOnly: PropTypes.bool,
screenReaderInputMessage: PropTypes.string,
showClearDate: PropTypes.bool,
customCloseIcon: PropTypes.node,
showDefaultInputIcon: PropTypes.bool,
customInputIcon: PropTypes.node,
inputIconPosition: PropTypes.oneOf([ICON_BEFORE_POSITION, ICON_AFTER_POSITION]),
noBorder: PropTypes.bool,
block: PropTypes.bool,
small: PropTypes.bool,
regular: PropTypes.bool,
autoComplete: PropTypes.string,

// calendar presentation and interaction related props
renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), // (month) => PropTypes.string,
orientation: PropTypes.oneOf([HORIZONTAL_ORIENTATION, VERTICAL_ORIENTATION]),
anchorDirection: PropTypes.oneOf([ANCHOR_LEFT, ANCHOR_RIGHT]),
openDirection: PropTypes.oneOf([OPEN_DOWN, OPEN_UP]),
horizontalMargin: PropTypes.number,
withPortal: PropTypes.bool,
withFullScreenPortal: PropTypes.bool,
appendToBody: PropTypes.bool,
disableScroll: PropTypes.bool,
initialVisibleMonth: PropTypes.func,
firstDayOfWeek: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6]),
numberOfMonths: PropTypes.number,
keepOpenOnDateSelect: PropTypes.bool,
reopenPickerOnClearDate: PropTypes.bool,
renderCalendarInfo: PropTypes.func,
renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), // ({ month, onMonthSelect, onYearSelect, isVisible }) => PropTypes.node,
hideKeyboardShortcutsPanel: PropTypes.bool,
daySize: nonNegativeInteger,
isRTL: PropTypes.bool,
verticalSpacing: PropTypes.number,

// navigation related props
navPrev: PropTypes.node,
navNext: PropTypes.node,
onPrevMonthClick: PropTypes.func,
onNextMonthClick: PropTypes.func,
onClose: PropTypes.func,
transitionDuration: nonNegativeInteger, // milliseconds

// day presentation and interaction related props
renderCalendarDay: PropTypes.func,
renderDayContents: PropTypes.func,
enableOutsideDays: PropTypes.bool,
isDayBlocked: PropTypes.func,
isOutsideRange: PropTypes.func,
isDayHighlighted: PropTypes.func,

// internationalization props
displayFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
monthFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
weekDayFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
phrases: PropTypes.shape(getPhrasePropTypes(SingleDatePickerPhrases)),
dayAriaLabelFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
```

#### DayPickerRangeController
The `DayPickerRangeController` is a calendar-only version of the `DateRangePicker`. There are no inputs and the calendar is always visible, but you can select a date range much in the same way you would with the `DateRangePicker`. You can control the selected
dates using the `startDate`, `endDate`, and `onDatesChange` props as shown below. Similarly, you can control which input is focused with the `focusedInput` and `onFocusChange` props as shown below. The user will only be able to select a date if `focusedInput` is provided.

Here is the minimum *REQUIRED* setup you need to get the `DayPickerRangeController` working:
```jsx
import { DateTime } from 'luxon';

<DayPickerRangeController
  startDate={this.state.startDate} // Luxon DateTime or null,
  endDate={this.state.endDate} // Luxon DateTime or null,
  onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })} // PropTypes.func.isRequired,
  focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
  onFocusChange={focusedInput => this.setState({ focusedInput })} // PropTypes.func.isRequired,
  initialVisibleMonth={() => DateTime.local().plus({ months: 2 })} // PropTypes.func or null,
/>
```

The following is a list of other *OPTIONAL* props you may provide to the `DayPickerRangeController` to customize appearance and behavior to your heart's desire. Again, please explore the [storybook](https://siod.github.io/react-dates/) for more information on what each of these props do.
```js
  // calendar presentation and interaction related props
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  renderCalendarInfo: PropTypes.func,
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), // ({ month, onMonthSelect, onYearSelect, isVisible }) => PropTypes.node,
  onOutsideClick: PropTypes.func,
  keepOpenOnDateSelect: PropTypes.bool,
  noBorder: PropTypes.bool,

  // navigation related props
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  transitionDuration: nonNegativeInteger, // milliseconds

  // day presentation and interaction related props
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  minimumNights: PropTypes.number,
  isOutsideRange: PropTypes.func,
  isDayBlocked: PropTypes.func,
  isDayHighlighted: PropTypes.func,

  // internationalization props
  monthFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  weekDayFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),
  dayAriaLabelFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
/>
```

## Localization

[Luxon](https://moment.github.io/luxon/) is a peer dependency of `react-dates`. Set its default locale in the component where Luxon is imported:

```js
import { Settings } from 'luxon';

Settings.defaultLocale = 'pl'; // Polish
```

Supplied values can override that default with `dateTime.setLocale(...)`. The picker preserves each value's Luxon zone and does not add separate locale or timezone props.

However, this only solves date localization. For complete internationalization of the components, `react-dates` defines a certain amount of [user interface strings](src/defaultPhrases.js) in English which can be changed through the `phrases` prop. For accessibility and usability concerns, **all these UI elements should be translated**.

Formatting props accept `Intl.DateTimeFormatOptions` or a callback receiving a `DateTime`. Formatting and calendar arithmetic are Gregorian. `isRTL` controls layout direction; there are no separate calendar or numbering-system props.

## Advanced

### Theming
Version 22 uses static CSS and `--react-dates-*` custom properties. The old `react-with-styles` interface and runtime theme registration APIs no longer affect rendered components. Import overrides after `react-dates/css`:

```css
:root {
  --react-dates-primary: #006c67;
  --react-dates-color-highlighted-background: #82e0aa;
  --react-dates-color-highlighted-background-active: #58d68d;
  --react-dates-color-highlighted-color: #186a3b;
}
```

`CustomizableCalendarDay` uses the same custom properties for its default style props. Explicit values passed through its style props continue to override those defaults.

[package-url]: https://www.npmjs.com/package/react-dates
[npm-version-svg]: https://img.shields.io/npm/v/react-dates.svg
[ci-svg]: https://github.com/siod/react-dates/actions/workflows/ci-modernization.yml/badge.svg
[ci-url]: https://github.com/siod/react-dates/actions/workflows/ci-modernization.yml
[license-image]: https://img.shields.io/npm/l/react-dates.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/react-dates.svg
[downloads-url]: https://www.npmjs.com/package/react-dates
