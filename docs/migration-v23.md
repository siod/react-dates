# Migrating to @siod/react-dates v23

Version 23 replaces runtime PropTypes declarations with a TypeScript-first public API. Component behavior, controlled state, Luxon values, CSS, and React 18/19 support remain unchanged from v22.

## TypeScript declarations

Public component props and supporting types are exported from the package root:

```ts
import type {
  DateRange,
  DateRangePickerProps,
  FocusedInput,
  SingleDatePickerProps,
} from '@siod/react-dates';
```

Applications should import these types rather than copying component prop shapes. The package provides declarations through both its CommonJS and ESM export conditions, including supported deep imports.

## Removed shape exports

The runtime `DateRangePickerShape` and `SingleDatePickerShape` exports have been removed. They were PropTypes validator objects, not component prop values.

Replace TypeScript uses with the corresponding exported prop type:

```diff
- import { DateRangePickerShape } from '@siod/react-dates';
+ import type { DateRangePickerProps } from '@siod/react-dates';

- type BookingPickerProps = typeof DateRangePickerShape;
+ type BookingPickerProps = DateRangePickerProps;
```

JavaScript components that composed those validators should use their own runtime validation at the application boundary if it is still required. Do not spread the removed objects into component props.

## JavaScript development warnings

The package no longer executes PropTypes validators. Invalid JavaScript props therefore no longer produce automatic PropTypes warnings in development. This removes `prop-types` from the package dependency graph and avoids shipping a second contract alongside the TypeScript declarations.

JavaScript consumers continue to receive the same runtime component behavior. Use the documented public API, tests, and application-level validation for untyped inputs. TypeScript consumers receive compile-time validation from the exported declarations.

## Dates and callbacks

Public dates remain Luxon `DateTime` values or `null`. Callback types, literal unions, nullability, and render arguments are represented by the exported declarations. Native `Date` objects, strings, and Moment values are not accepted date values.

## Upgrade checklist

1. Upgrade `@siod/react-dates` and keep compatible React, React DOM, and Luxon peers installed.
2. Remove imports of `DateRangePickerShape` and `SingleDatePickerShape`.
3. Import public prop and supporting types from `@siod/react-dates`.
4. Replace any reliance on PropTypes console warnings with TypeScript or application-boundary validation.
5. Run your typecheck and controlled-picker interaction tests.

For the complete public contract, see [`src/types.ts`](../src/types.ts) and the [strict TypeScript example](../examples/TypeScriptUsage.tsx).
