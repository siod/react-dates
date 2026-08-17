# Test Suite Cleanup and Legacy Coverage Recovery

## Objective

Replace the temporary `test-modern` namespace with the canonical `test`
directory and recover the still-relevant behavioral coverage removed with the
Mocha/Enzyme suite. Use Vitest, React Testing Library, and Playwright without
restoring Moment, Enzyme, Sinon, or implementation-detail testing.

## Baseline

- Legacy suite on `master`: approximately 1,138 declared cases.
- Current suite: 55 Vitest cases and 45 Playwright cases.
- Current V8 coverage: 59.39% statements, 49.24% branches, 51.58% functions,
  and 61.25% lines.
- Release target: at least 90% statements, 85% branches, 90% functions, and
  90% lines.

## Ownership and migration rules

- The Sol lead owns configuration, shared helpers, production fixes, coverage
  thresholds, the legacy disposition matrix, and integration.
- Up to three Luna-high workers operate concurrently on disjoint test files.
- Workers do not edit production source. They report behavioral mismatches for
  lead diagnosis rather than weakening expectations to match regressions.
- Every legacy case receives one disposition: `ported`, `combined`, `browser`,
  `obsolete`, or `replaced`.
- Preserve observable behavior, public callback payloads, accessibility, CSS
  classes, focus, and keyboard contracts. Do not port Enzyme instance/state,
  lifecycle, or exact private-call assertions.
- All date tests use valid Luxon `DateTime` values, explicit zones/locales where
  relevant, and deterministic fixed dates.

## Wave 0 — canonical directory and frozen harness

1. Rename `test-modern` to `test`.
2. Update Vitest, Playwright, ESLint, and Knip path references.
3. Add `docs/modernization/legacy-test-matrix.md` and account for every legacy
   file and test case.
4. Freeze the Testing Library helpers before delegation.
5. Verify the rename alone preserves 55 unit and 45 browser cases.

## Wave 1 — utilities

Three Luna-high workers own separate files:

1. Date comparisons: same/before/after, inclusive comparisons, adjacent
   days/months, invalid inputs, local-calendar semantics, zones, and hot paths.
2. Calendar projection: month weeks, visible days, outside days, locale week
   starts, month boundaries, invalid inputs, and DST.
3. Remaining utilities: ISO/localized serialization, dimensions, positioning,
   scroll/focus helpers, transition support, transforms, phrases, and styling.

Moment-only helpers such as `getPooledMoment` and `toMomentObject` are obsolete.
The removed `getSelectedDateOffset` helper is not restored, but its retained
public offset behavior must be covered through picker/controller tests.

## Wave 2 — calendar and input surfaces

1. Calendar primitives worker: `CalendarDay`, `CustomizableCalendarDay`,
   `CalendarWeek`, `CalendarMonth`, and `CalendarMonthGrid`.
2. DayPicker worker: `DayPicker`, navigation, keyboard shortcuts, and shortcut
   rows.
3. Input worker: `DateInput`, single/range inputs, and input controllers.

Required coverage includes modifier classes, ARIA phrases, custom renders,
keyboard activation, focus, disabled/custom/RTL navigation, locale-aware input,
blocked/out-of-range dates, clearing, minimum nights, and callback payloads.

## Wave 3 — day-picker controllers

1. Range selection worker: selection, focus, callbacks, minimum nights, offsets,
   and keep-open behavior.
2. Range modifier worker: blocking, highlighting, hover preview, touch behavior,
   modifiers, and navigation.
3. Single controller worker: selection/unselection, modifiers, custom renders,
   and navigation.

Controller coverage is consolidated around rendered behavior rather than the
hundreds of legacy assertions against private state and modifier helpers.

## Wave 4 — public shells and browsers

1. `DateRangePicker` shell worker.
2. `SingleDatePicker` shell worker.
3. Playwright worker for keyboard, accessibility, cross-browser interaction,
   and deterministic Chromium visual snapshots.

Shell coverage includes portals, outside click, scroll lock, cleanup, initial
month precedence, disabled/min/max/offset behavior, and focus transitions.
Visual fixtures cover default, selected/hovered range, disabled dates, RTL,
vertical, portal, shortcuts panel, and narrow responsive layouts.

## Wave 5 — reconciliation and release gate

1. Leave no legacy matrix entry unreviewed.
2. Remove duplication only where retained coverage is equal or stronger.
3. Ratchet coverage after each successful wave; never reduce a threshold.
4. Reach at least 90/85/90/90 statements/branches/functions/lines.
5. Run ESLint, Knip, Vitest and coverage, Playwright in Chromium/Firefox/WebKit,
   React 18/19 CI-equivalent checks, CJS/ESM builds, Storybook, packed-consumer
   fixtures, and `git diff --check`.

Completeness is measured by explicit legacy-case disposition and preserved
behavior, not by mechanically recreating all 1,138 historical test cases.

## Implementation result

- The canonical `test/` directory now replaces `test-modern` across Vitest,
  Playwright, ESLint, and Knip.
- The final legacy disposition matrix reconciles all 1,138 cases: 57 ported
  one-for-one, 1,048 combined into observable behavior tests, 12 obsolete
  Moment-only contracts, and 21 replaced by higher-level public behavior.
- Vitest enforces 90% statements, 85% branches, 90% functions, and 90% lines.
  Current case counts and coverage are reported by CI rather than duplicated in
  this plan, so test consolidation cannot leave this result section stale.
- Playwright covers Chromium, Firefox, and WebKit interactions plus deterministic
  Chromium snapshots for the planned visual states. Current counts are reported
  by CI.
- Controller regressions exposed by the recovered tests were fixed, including
  Luxon date offsets, dynamic minimum nights, hover modifiers, controlled month
  synchronization, prop-driven modifier refresh, and scrollable callbacks.
- Range selection keeps DOM focus inside the calendar while advancing logical
  focus to the end date; Escape remains a separate close action.
- ESLint, Knip, CJS/ESM builds, Storybook, React 18 CJS and React 19 ESM packed
  consumers, and `git diff --check` pass.
