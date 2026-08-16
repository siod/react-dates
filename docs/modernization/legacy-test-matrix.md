# Legacy Test Disposition Matrix

This ledger maps every legacy test file on `master` to its v22 migration
disposition. Counts are declared `it(...)` cases. Observable contracts are
represented in Vitest/Testing Library or Playwright; implementation-detail
cases were combined or retired after review.

## Utilities — 188 cases

| Legacy file | Cases | Final disposition |
| --- | ---: | --- |
| `calculateDimension_spec.js` | 11 | Combined in `test/utils/layout-legacy.test.js`; formerly skipped DOM cases are deterministic |
| `disableScroll_spec.js` | 6 | Combined in `test/utils/browser-helpers-legacy.test.js` |
| `getActiveElement_spec.js` | 3 | Combined in `test/utils/browser-helpers-legacy.test.js`; SSR import behavior retained in the contract suite |
| `getCalendarDaySettings_spec.js` | 17 | Replaced by CalendarDay observable tests |
| `getCalendarMonthWeeks_spec.js` | 26 | Combined in `test/utils/calendar-projection-legacy.test.js`; Moment validation/noon internals retired |
| `getCalendarMonthWidth_spec.js` | 3 | Combined in `test/utils/layout-legacy.test.js` |
| `getDetachedContainerStyles_spec.js` | 4 | Combined in `test/utils/layout-legacy.test.js` |
| `getInputHeight_spec.js` | 2 | Combined in `test/utils/layout-legacy.test.js` |
| `getNumberOfCalendarMonthWeeks_spec.js` | 4 | Combined in `test/utils/calendar-projection-legacy.test.js` |
| `getPhrasePropTypes_spec.js` | 1 | Ported in `test/utils/layout-legacy.test.js` |
| `getPhrase_spec.js` | 4 | Combined in `test/utils/layout-legacy.test.js` |
| `getPooledMoment_spec.js` | 3 | Obsolete: Moment pooling removed |
| `getResponsiveContainerStyles_spec.js` | 4 | Combined in `test/utils/layout-legacy.test.js` |
| `getSelectedDateOffset_spec.js` | 4 | Replaced by public offset behavior tests |
| `getTransformStyles_spec.js` | 4 | Combined in `test/utils/layout-legacy.test.js` |
| `getVisibleDays_spec.js` | 3 | Ported in `test/utils/calendar-projection-legacy.test.js` |
| `isAfterDay_spec.js` | 7 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isBeforeDay_spec.js` | 7 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isDayVisible_spec.js` | 7 | Combined in `test/utils/calendar-projection-legacy.test.js`, including active IANA DST coverage |
| `isInclusivelyAfterDay_spec.js` | 5 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isInclusivelyBeforeDay_spec.js` | 5 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isNextDay_spec.js` | 4 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isNextMonth_spec.js` | 5 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isPrevMonth_spec.js` | 5 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isPreviousDay_spec.js` | 4 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isSameDay_spec.js` | 5 | Ported in `test/utils/date-comparison-legacy.test.js` with hot-path guards |
| `isSameMonth_spec.js` | 4 | Ported in `test/utils/date-comparison-legacy.test.js` |
| `isTransitionEndSupported_spec.js` | 3 | Combined in `test/utils/browser-helpers-legacy.test.js`; SSR import behavior retained in the contract suite |
| `noflip_spec.js` | 3 | Combined in `test/utils/layout-legacy.test.js` |
| `toISODateString_spec.js` | 6 | Combined in `test/utils/serialization-legacy.test.js`; Moment/string parsing retired |
| `toISOMonthString_spec.js` | 5 | Combined in `test/utils/serialization-legacy.test.js`; Moment/string parsing retired |
| `toLocalizedDateString_spec.js` | 5 | Combined in `test/utils/serialization-legacy.test.js`; custom Moment tokens retired |
| `toMomentObject_spec.js` | 9 | Obsolete: removed public Moment conversion |

## Calendar and DayPicker — 247 cases

| Legacy file | Cases | Final disposition |
| --- | ---: | --- |
| `CalendarDay_spec.jsx` | 28 | Combined in `test/components/calendar/CalendarDay.legacy.test.jsx` |
| `CustomizableCalendarDay_spec.jsx` | 27 | Combined in `test/components/calendar/CustomizableCalendarDay.legacy.test.jsx` |
| `CalendarWeek_spec.jsx` | 1 | Ported in `test/components/calendar/CalendarWeek.legacy.test.jsx` |
| `CalendarMonth_spec.jsx` | 6 | Combined in `test/components/calendar/CalendarMonth.legacy.test.jsx` |
| `CalendarMonthGrid_spec.jsx` | 7 | Combined in `test/components/calendar/CalendarMonthGrid.legacy.test.jsx` |
| `DayPickerNavigation_spec.jsx` | 27 | Combined in `test/components/daypicker/DayPickerNavigation.test.jsx` |
| `DayPickerKeyboardShortcuts_spec.jsx` | 34 | Combined in `test/components/daypicker/DayPickerKeyboardShortcuts.test.jsx`; implementation-detail assertions retired |
| `KeyboardShortcutRow_spec.jsx` | 1 | Ported in `test/components/daypicker/KeyboardShortcutRow.test.jsx` |
| `DayPicker_spec.jsx` | 116 | Combined in `test/components/daypicker/DayPicker.test.jsx`; private state/exact-call assertions retired |

## Inputs, controllers, and public pickers — 703 cases

| Legacy file | Cases | Final disposition |
| --- | ---: | --- |
| `DateInput_spec.jsx` | 33 | Combined in `test/components/inputs/dateInput-legacy.test.jsx` |
| `DateRangePickerInputController_spec.jsx` | 72 | Combined in `test/components/inputs/inputControllers-legacy.test.jsx`; Moment parsing internals retired |
| `DateRangePickerInput_spec.jsx` | 17 | Combined in `test/components/inputs/pickerInput-legacy.test.jsx` |
| `DateRangePicker_spec.jsx` | 59 | Combined in `test/components/pickers/date-range/dateRangePicker-legacy.test.jsx`, reinforced by Playwright flows |
| `DayPickerRangeController_spec.jsx` | 317 | Combined across `test/components/controllers/range-selection/rangeSelection-legacy.test.jsx` and `range-modifiers/*.test.jsx`; private helper/state assertions retired |
| `DayPickerSingleDateController_spec.jsx` | 116 | Combined in `test/components/controllers/single/DayPickerSingleDateController.test.jsx`; private helper/state assertions retired |
| `SingleDatePickerInputController_spec.jsx` | 29 | Combined in `test/components/inputs/inputControllers-legacy.test.jsx`; Moment parsing internals retired |
| `SingleDatePickerInput_spec.jsx` | 10 | Combined in `test/components/inputs/pickerInput-legacy.test.jsx` |
| `SingleDatePicker_spec.jsx` | 50 | Combined in `test/components/pickers/single-date/SingleDatePicker.test.jsx`, reinforced by Playwright flows |

## Legacy harness files

| Legacy file | Disposition |
| --- | --- |
| `_helpers/describeIfWindow.js` | Replaced by explicit jsdom/browser tests |
| `_helpers/enzymeSetup.js` | Obsolete: Enzyme removed |
| `_helpers/registerReactWithStylesInterface.js` | Obsolete: react-with-styles removed |
| `_helpers/restoreSinonStubs.js` | Replaced by Vitest mock restoration |
| `_helpers/withTouchSupport.js` | Replaced by deterministic browser/touch mocks |
| `browser-main.js` | Replaced by Vitest setup and Playwright fixtures |
| `mocha.opts` | Obsolete: Mocha removed |

## Reconciliation

| Disposition | Legacy cases |
| --- | ---: |
| Ported one-for-one | 57 |
| Combined into observable behavior tests | 1,048 |
| Browser-only | 0 |
| Obsolete Moment-only contracts | 12 |
| Replaced by higher-level public behavior | 21 |
| **Total** | **1,138** |

The Playwright suite reinforces keyboard, focus, pointer, accessibility, RTL,
portal, responsive, and hover contracts, but no legacy case is browser-only.
