# React 18+ and Dependency Modernization Plan

## Summary

Release `@siod/react-dates` 22.0.0 as a major modernization of the fork:

- Require Node `>=22.22.2`.
- Support and test React 18 and React 19; declare peers as `^18.0.0 || ^19.0.0`.
- Preserve existing components, prop names, callback shapes, CSS classes, and documented import paths; replace Moment values with Luxon `DateTime` instances.
- Remove obsolete React compatibility code and every deprecated, abandoned, unused, or platform-redundant direct dependency.
- Replace Moment and Moment-Jalaali with Luxon 3.7 as a public peer and the internal date implementation. See [Why does Luxon exist?](https://github.com/moment/luxon/blob/master/docs/why.md) and the [Luxon API](https://moment.github.io/luxon/api-docs/index.html).
- Treat Luxon `DateTime` values, `Intl`-based formatting, and removal of custom `react-with-styles` interfaces as the intentional consumer-facing breaks in this major release.

## Public Contract and Packaging

- Preserve root exports plus `@siod/react-dates/constants`, `@siod/react-dates/initialize`, `@siod/react-dates/lib/css/_datepicker.css`, legacy `lib`/`esm` component deep imports, and existing `Pure*` named exports. Remove the `DefaultTheme` deep import because the runtime JavaScript theming API no longer exists.
- Keep `initialize` as a harmless compatibility module; consumers no longer need to call it.
- Add conditional package exports for CommonJS and ESM while retaining root compatibility wrappers.
- Build per-module ESM into `esm/` and CommonJS into `lib/` using Vite 8 with preserved modules and peer dependencies externalized.
- Add `module`, `exports`, `sideEffects`, `files`, and `engines` metadata. Add `@siod/react-dates/css` as a supported alias for the existing stylesheet.
- Remove the public `toMomentObject` export; consumers use the `DateTime` values already exposed by every date boundary.
- Require valid Luxon `DateTime` instances or `null` for `date`, `startDate`, `endDate`, `minDate`, and `maxDate`; return the same representation from `onDateChange`, `onDatesChange`, and `onClose`.
- Require `initialVisibleMonth` to return a `DateTime`, and pass `DateTime` values to date predicates, formatter callbacks, day/month render callbacks, and custom calendar-day render props.
- Keep existing formatting prop names, but accept `Intl.DateTimeFormatOptions` or a formatter callback receiving a `DateTime`. Defaults are `{ dateStyle: 'short' }` for inputs, `{ month: 'long', year: 'numeric' }` for month headings, `{ weekday: 'short' }` for weekdays, and `{ dateStyle: 'full' }` for day ARIA labels.
- Preserve the original implicit localization contract without adding a picker-specific `locale` prop: use each DateTime's locale and Luxon's `Settings.defaultLocale` for empty state and parsing. Keep arithmetic Gregorian and do not add public calendar, numbering-system, or timezone props.
- Use the following final production dependency allowlist:
  - Dependencies: `prop-types@^15.8.1`.
  - Peers: `luxon@^3.7.2`, `react`, and `react-dom`.
  - Development copies of those peers for tests and builds.
- Commit `package-lock.json`, remove `package-lock=false`, and use npm consistently.

## Implementation Changes

### React and browser behavior

- Keep class components where practical, but replace all seven `componentWillReceiveProps` and two `componentWillUpdate` methods with derived render calculations, `getDerivedStateFromProps`, snapshots, or `componentDidUpdate` as appropriate.
- Remove the React 0.14-15 `PureComponent` Babel fallback and use `React.PureComponent` directly.
- Make subscriptions, timers, animation frames, scroll locks, and portal containers idempotent and fully cleaned up under React 18 Strict Mode. See the [React 18 upgrade guidance](https://react.dev/blog/2022/03/08/react-18-upgrade-guide).
- Replace `react-portal` with a local SSR-safe wrapper around React DOM's `createPortal`, including body-container creation and cleanup. See the [React `createPortal` documentation](https://react.dev/reference/react-dom/createPortal).
- Replace outside-click, resize, transition, and focus listeners with local native-event helpers using stable listener references and cleanup functions.
- Replace touch-device detection with a guarded helper using `matchMedia('(pointer: coarse)')` and `navigator.maxTouchPoints`.
- Replace `raf`, `lodash/throttle`, `Object.values` shims, and Object.assign transforms with native APIs plus small tested local fallbacks where SSR or test environments require them.
- Target evergreen browsers with `>0.5%, not dead, not IE 11`.

### Styling

- Replace the complete `react-with-styles` ecosystem with authored global CSS processed by Lightning CSS.
- Convert every style key into the same deterministic class name currently emitted, preserving consumer override selectors and visual behavior.
- Keep runtime dimensions, transforms, and measured positions as inline styles; use a local class/style merging helper for conditional modifiers.
- Express styling defaults as documented `--react-dates-*` CSS custom properties. Keep any tokens required by the internal static-class adapter private rather than exposing a second, ineffective theming API.
- Preserve RTL behavior using existing `isRTL` modifiers, `dir="rtl"`, logical CSS properties, and explicit exceptions previously represented by `noflip`.
- Document that `ThemedStyleSheet.registerInterface/registerTheme` and Aphrodite interfaces no longer affect components. Consumers must import the CSS and override CSS variables or existing selectors.

### Luxon migration

- Remove Moment, Moment-Jalaali, and `react-moment-proptypes` from runtime, examples, tests, packaging, and current documentation except migration examples; do not ship a dual Moment/Luxon compatibility layer.
- Use valid Luxon `DateTime` instances at public and internal boundaries. Keep the adapter narrow: public PropType validation, Gregorian localized parsing/formatting, and configurable week rules. Keep ordinary comparisons, serialization, and calendar-grid generation in the existing utility layer.
- Reject strings, invalid DateTimes, and other date-object types at the public boundary. Treat comparisons as calendar-day comparisons while preserving each DateTime's zone through immutable Luxon arithmetic.
- Replace mutable Moment operations with immutable Luxon operations: `add/subtract` with `plus/minus`, setters with `set`, comparisons with `hasSame` or millisecond comparisons, and formatting with `toFormat`/`toLocaleString`.
- Normalize Moment's zero-based months and Sunday-based weekdays in the relevant utility or locale-week helper because Luxon months are 1-12 and weekdays are Monday=1 through Sunday=7.
- Parse typed input strictly with locale-aware `Intl` options implemented through the adapter, with ISO input as an unconditional input-field fallback; return a valid `DateTime` or `null` through the existing controlled-component flow.
- Remove Moment/Luxon token constants from the public surface and add frozen, library-neutral default `Intl.DateTimeFormatOptions` constants instead.
- Derive locale week starts and localized labels from Luxon `Info`/`Intl`; consumers configure localization through DateTime instances or `Settings.defaultLocale`.
- Remove the old third-party calendar demo integration without promoting it into the public contract. Preserve Luxon locale behavior, RTL, and formatter/render callback extension points, but keep built-in formatting and arithmetic Gregorian-only.
- Validate public date props with a local valid-`DateTime` PropType validator and test that Luxon instances cross every public callback and render prop unchanged.

### Dependency and tooling replacement

| Remove | Replacement |
| --- | --- |
| Enzyme, adapter helpers, Cheerio | React Testing Library 16 and Playwright interactions |
| Mocha, Chai, Sinon, mocha-wrap, sinon-sandbox, NYC | Vitest 4, its assertions/mocks, and V8 coverage |
| Karma, browser launchers, Webpack 4 and loaders | Vitest/jsdom tests and Playwright 1.62 |
| Storybook 5 and obsolete addons | Storybook 10.5 with React/Vite, CSF3, autodocs, and accessibility addon |
| Babel CLI, Airbnb preset, legacy SVG/object transforms and runtime fallback | Vite 8; convert the six SVGs into normal React components |
| react-with-styles and all interfaces, Aphrodite, direction provider | Static CSS, CSS variables, and native `dir` handling |
| airbnb-prop-types | Local equivalents for the four validators used by the library |
| moment, moment-jalaali, react-moment-proptypes | Public Luxon 3.7 peer, direct `DateTime` operations, and a valid-DateTime validator |
| consolidated-events, is-touch-device, react-outside-click-handler, react-portal, raf | Small native helpers and React DOM portal APIs |
| lodash, object.assign, object.values, color2k | Native/local utilities and precomputed theme colors |
| clean-css | Lightning CSS 1 |
| Airbnb ESLint config and styling plugin | ESLint 9 flat config with React, Hooks, JSX-a11y, and import-x plugins |
| git-directory-deploy, in-publish, safe-publish-latest | GitHub Pages actions and `prepublishOnly` validation |
| mkdirp, rimraf, cross-env, airbnb-js-shims, unused TypeScript | Node APIs or configuration-driven scripts |

- Run Knip in CI to reject unused dependencies and exports.
- Review the resulting full lockfile for deprecated or archived transitives; replace their owning top-level package until the lock contains no deprecated package entries.

## Agent Implementation Plan

This migration is suitable for a four-agent Codex team only when it is executed as gated waves with exclusive file ownership. Use one `gpt-5.6-sol` lead at high reasoning effort and up to three `gpt-5.6-luna` workers at high reasoning effort. Sol owns architecture, shared integration surfaces, commits, and release decisions; Luna workers receive bounded migrations with explicit inputs and acceptance tests. This follows the model split in the [official GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/latest-model): Sol for frontier capability, Luna for efficient high-volume work, and parallel agents only for workstreams that divide cleanly.

### Coordination rules

- Run at most four active agents: the Sol lead plus three Luna-high workers.
- The Sol lead is the only agent allowed to edit `package.json`, `package-lock.json`, public entrypoints, package exports, shared constants, the global CSS entrypoint, or release documentation, and is the only agent that commits or pushes.
- Give every worker an exact file allowlist. Workers must not make opportunistic edits outside it; instead they report required shared-file changes to Sol.
- Workers run focused tests for their own files and return a handoff containing changed files, commands and results, unresolved risks, and requested integration edits.
- Sol reviews and integrates each handoff before opening the next wave. Do not let a later wave code against unreviewed worker changes.
- Keep temporary migration dependencies only while both test systems or build paths must coexist. Sol removes them and regenerates the lockfile before the dependency-audit gate.
- If a frozen interface proves insufficient, pause the affected worker, let Sol revise the interface, and then restart that bounded task. Workers do not independently redefine cross-workstream contracts.

### Wave 0 — Baseline and contract freeze (Sol, serial)

1. Create the implementation branch from the reviewed plan and record the current commit, dependency tree, build/package output, test status, public exports, generated CSS, and representative rendered states. Mark failures caused by the legacy toolchain as baseline failures rather than silently fixing them.
2. Freeze the v22 public date contract: valid Luxon `DateTime | null` values and Gregorian `Intl.DateTimeFormatOptions` or DateTime callbacks for formatting. Preserve Moment's implicit localization behavior through DateTime locale and `Settings.defaultLocale`; do not add a `locale` prop. Add contract tests that reject Moment, strings, native Dates, and invalid DateTimes at public boundaries.
3. Define and document narrow internal interfaces for the date adapter, portal/event helpers, class/style merging, and test render helpers. Decide their filenames and exports before delegation.
4. Add the minimum transitional Vitest/Vite scaffolding needed for foundation tests while retaining legacy tooling only where a test has not yet been migrated.

Gate 0: Sol can run one Vitest smoke test, build both module formats, inspect the packed file list, and give each worker a non-overlapping allowlist against frozen interfaces.

### Wave 1 — Independent foundations (three Luna-high workers)

#### Worker A: date foundation

Own only the date-adapter directory, the date utilities assigned by Sol, their utility tests, and the local DateTime PropType validator.

- Implement DateTime validation, calendar-day comparison, month/week generation, locale week data, and `Intl`-based formatting/parsing while preserving DateTime zones.
- Replace Moment utility behavior with direct Luxon operations plus narrow shared helpers without editing picker components, public exports, shared constants, or manifests.
- Add leap-year, invalid-date, month-boundary, weekday-index, locale-pattern, localized-digit, and real IANA DST-transition cases. Include at least `UTC`, `America/New_York`, `Europe/London`, `Australia/Brisbane`, and `Pacific/Apia`; do not model DST with a fixed UTC offset.

#### Worker B: browser and presentation foundation

Own only new local portal, event, touch, animation-frame, throttle, scroll-lock, class/style helpers, SVG React components, theme CSS variables, component-independent CSS, and their focused tests.

- Make helpers SSR-safe and idempotent under Strict Mode, with stable listener identities and complete cleanup.
- Establish the deterministic legacy class-name mapping and RTL/noflip rules, but do not edit picker components or the global CSS entrypoint.
- Provide a mapping report from every removed presentation/runtime package to its local or platform replacement.

#### Worker C: test and build foundation

Own only Vitest/Testing Library helpers and configuration, Playwright configuration and fixtures, Storybook configuration, package-install fixture directories, and CI workflow drafts explicitly assigned by Sol.

- Provide Strict Mode render helpers, console/leak failure handling, browser projects, axe setup, visual snapshot conventions, and CommonJS/ESM package-consumer fixtures.
- Convert a small representative test from each test category to prove the harness, without editing component implementation files or the manifest.
- Return the exact dependency and script changes Sol must apply to `package.json`; do not apply them directly.

Gate 1: Sol reviews all foundation APIs, applies shared manifest/configuration edits, runs foundation tests together, verifies SSR import safety, and commits one integrated foundation checkpoint. No component wave starts while either adapter or helper contracts are still changing.

### Wave 2 — Component migration (three Luna-high workers)

Each worker owns its listed component implementations, matching component tests, and matching component CSS partials. Sol owns any change needed in shared shapes, constants, exports, phrases, CSS aggregation, or package metadata.

| Worker | Exclusive component cluster | Required outcome |
| --- | --- | --- |
| A | `CalendarDay`, `CustomizableCalendarDay`, `CalendarWeek`, `CalendarMonth`, `CalendarMonthGrid`, and their tests/styles | DateTime day rendering, Luxon month/week math, preserved classes/RTL/visual states, and behavioral RTL tests |
| B | `DayPicker`, `DayPickerNavigation`, `DayPickerKeyboardShortcuts`, `KeyboardShortcutRow`, `DayPickerRangeController`, `DayPickerSingleDateController`, and their tests/styles | Modern lifecycles, Strict Mode-safe effects, DateTime callbacks, keyboard/focus/navigation parity, and cleanup tests |
| C | `DateInput`, all `DateRangePicker*`, all `SingleDatePicker*`, and their tests/styles | Controlled DateTime input/output, strict localized parsing, portal/outside-click/scroll behavior, formatter callbacks, null/error handling, and public-boundary tests |

Small icon components are assigned by Sol to exactly one cluster or retained for Sol integration. A worker may import another cluster only through the frozen props contract and must not edit that cluster.

Gate 2: Sol integrates clusters in the order calendar primitives, controllers, then public pickers; resolves shared shape/constant/export changes; aggregates CSS; and removes every remaining direct Moment or `react-with-styles` use. The full migrated unit suite, Strict Mode suite, SSR smoke suite, and production build must pass before cleanup.

### Wave 3 — Toolchain cleanup and packaging (Sol, serial)

1. Remove the legacy test/build/Storybook configurations, compatibility scripts, obsolete source helpers, Moment/Jalaali artifacts, and superseded dependencies.
2. Finalize Vite preserved-module CommonJS/ESM output, conditional exports, the CSS alias, compatibility wrappers, peer ranges, side-effect metadata, and npm scripts.
3. Regenerate `package-lock.json`, run Knip, inspect deprecated transitive packages, and confirm that production dependencies contain only `prop-types`, with Luxon, React, and React DOM declared as peers.
4. Convert remaining examples and stories, then update migration documentation with public Luxon `DateTime` examples.

Gate 3: a clean checkout can run `npm ci`, lint, unit tests, coverage, production build, Storybook build, and `npm pack`; no removed dependency name appears in runtime source, examples, tests, or published files except migration documentation.

### Wave 4 — Independent verification (three Luna-high reviewers)

- Reviewer A owns date correctness verification: fuzz valid date ranges, leap years, Gregorian locale parsing, localized digits, and the five-zone DST matrix. This reviewer adds tests only in a dedicated verification directory.
- Reviewer B owns UI verification: Chromium/Firefox/WebKit flows, accessibility, keyboard-only behavior, focus restoration, RTL, responsive layouts, portals, and Chromium visual snapshots.
- Reviewer C owns package verification: React 18/19 consumer fixtures, Node 22/24, CommonJS/ESM/deep imports/CSS, lockfile and Knip audits, Storybook, and tarball contents.
- Reviewers do not fix implementation code. They report reproducible failures to Sol, who assigns a narrowly scoped fix to the original owner or implements the integration fix directly.

Gate 4: Sol runs the entire CI matrix from a clean checkout, confirms coverage thresholds, reviews the package diff and dependency audit, and publishes `22.0.0-rc.0` only after every reviewer report is resolved.

### Definition of done

- React 18 and 19 pass in Strict Mode on Node 22 and 24 with no lifecycle, unmount-update, listener-leak, or unhandled-console warnings.
- Every public date value and callback uses a valid Luxon `DateTime`; Moment values, strings, native Dates, and library-specific formatting tokens are rejected.
- Calendar-day behavior and DateTime zone preservation survive the locale, leap-year, month-boundary, and real timezone/DST matrices without selected-day drift.
- Existing CSS classes and supported import paths remain compatible, while removed styling interfaces fail only in the documented v22 manner.
- Unit, SSR, browser, accessibility, visual, Storybook, build, dependency, and packed-consumer checks pass from a clean checkout.
- The release candidate includes migration guides for dates, formatting, styling, removed non-Gregorian integration, imports, and removed APIs.

## Test, CI, and Release Plan

- Convert utility tests directly to Vitest and rewrite Enzyme component tests around rendered behavior instead of component instances, state, or private methods.
- Cover controlled DateTime selection, null handling, invalid DateTime and string rejection, range rules, month and weekday index conversion, strict Gregorian localized parsing, `Intl` formatting and DateTime callbacks, localized digits, leap years, daylight-saving boundaries, month navigation, keyboard navigation, focus restoration, outside clicks, portals, scroll locking, responsive positioning, touch behavior, locale changes, RTL, and all orientation variants.
- Render the component suite inside `StrictMode`; fail on React lifecycle warnings, state updates after unmount, leaked listeners, or unhandled console errors.
- Add SSR smoke tests proving root imports and component rendering do not access `window` or `document` during module evaluation.
- Add Playwright tests in Chromium, Firefox, and WebKit; keep visual snapshots in Chromium for default, portal, RTL, vertical, selected-range, disabled, and responsive states.
- Run axe accessibility checks and keyboard-only flows for every public picker.
- Enforce at least 90% statements/lines/functions and 85% branch coverage.
- Test CI matrices on Node 22 and 24 with React 18 and 19.
- Run lint, dependency checks, unit tests, browser tests, Storybook build, production build, and `npm pack` validation.
- Install the packed tarball into isolated CommonJS and ESM fixtures and verify root, constants, initialize, CSS, theme, and representative deep imports.
- Replace legacy workflows with supported official GitHub actions, weekly Dependabot updates, GitHub Pages Storybook deployment, and an approval-gated npm trusted-publishing workflow using provenance.
- Publish `22.0.0-rc.0` first, validate the package fixtures and hosted Storybook, then publish `22.0.0` with a Moment-to-Luxon migration guide, formatting/styling migration guides, and dependency audit report.

## Assumptions

- No conversion to TypeScript or hooks-only components is included; those would add risk without being required for React 18.
- React versions after 19 are added to the peer range only after passing the same CI matrix.
- Valid Luxon `DateTime` instances are the only supported public date values in v22; Moment users remain on v21 until they migrate.
- Moment and Luxon formatting strings are not accepted by v22; formatting uses `Intl.DateTimeFormatOptions` or callbacks, and `toMomentObject` is removed without a library-specific replacement.
- Luxon 3 is an intentional public peer and internal implementation dependency for v22.
- Existing visual behavior and CSS class hooks are compatibility requirements; custom `react-with-styles` interface registration is intentionally discontinued.
- IE and other obsolete browsers are out of scope.
