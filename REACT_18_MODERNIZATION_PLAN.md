# React 18+ and Dependency Modernization Plan

## Summary

Release `react-dates` 22.0.0 as a major modernization:

- Require Node `>=22.22.2`.
- Support and test React 18 and React 19; declare peers as `^18.0.0 || ^19.0.0`.
- Preserve existing components, prop names, callback shapes, CSS classes, and documented import paths; replace Moment values with canonical `YYYY-MM-DD` strings.
- Remove obsolete React compatibility code and every deprecated, abandoned, unused, or platform-redundant direct dependency.
- Replace Moment and Moment-Jalaali with Luxon 3.7 as a private implementation dependency; do not expose Luxon objects or formatting conventions through the public API. See [Why does Luxon exist?](https://github.com/moment/luxon/blob/master/docs/why.md) and the [Luxon API](https://moment.github.io/luxon/api-docs/index.html).
- Treat library-neutral ISO date strings, `Intl`-based formatting, and removal of custom `react-with-styles` interfaces as the intentional consumer-facing breaks in this major release.

## Public Contract and Packaging

- Preserve root exports plus `react-dates/constants`, `react-dates/initialize`, `react-dates/lib/css/_datepicker.css`, legacy `lib`/`esm` deep imports, `DefaultTheme`, and existing `Pure*` named exports.
- Keep `initialize` as a harmless compatibility module; consumers no longer need to call it.
- Add conditional package exports for CommonJS and ESM while retaining root compatibility wrappers.
- Build per-module ESM into `esm/` and CommonJS into `lib/` using Vite 8 with preserved modules and peer dependencies externalized.
- Add `module`, `exports`, `sideEffects`, `files`, and `engines` metadata. Add `react-dates/css` as a supported alias for the existing stylesheet.
- Remove the public `toMomentObject` export without adding a Luxon-specific replacement.
- Require canonical `YYYY-MM-DD` strings or `null` for `date`, `startDate`, `endDate`, `minDate`, and `maxDate`; return the same representation from `onDateChange`, `onDatesChange`, and `onClose`.
- Require `initialVisibleMonth` to return a canonical ISO date string, and pass ISO strings to date predicates, day/month render callbacks, and custom calendar-day render props so consumers can use any date library or none.
- Keep existing formatting prop names, but accept `Intl.DateTimeFormatOptions` or a formatter callback receiving an ISO date string. Defaults are `{ dateStyle: 'short' }` for inputs, `{ month: 'long', year: 'numeric' }` for month headings, `{ weekday: 'short' }` for weekdays, and `{ dateStyle: 'full' }` for day ARIA labels.
- Add optional `locale` and `numberingSystem` props to top-level pickers/controllers and propagate them to all default formatters; keep dates Gregorian and timezone-free and do not add public calendar or timezone props.
- Use the following final production dependency allowlist:
  - Dependencies: `prop-types@^15.8.1` and `luxon@^3.7.2`.
  - Peers: `react` and `react-dom`.
  - Development copies of those peers for tests.
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
- Express `DefaultTheme` values as documented `--react-dates-*` CSS custom properties while retaining the existing JavaScript theme object as a compatibility reference.
- Preserve RTL behavior using existing `isRTL` modifiers, `dir="rtl"`, logical CSS properties, and explicit exceptions previously represented by `noflip`.
- Document that `ThemedStyleSheet.registerInterface/registerTheme` and Aphrodite interfaces no longer affect components. Consumers must import the CSS and override CSS variables or existing selectors.

### Luxon migration

- Remove Moment, Moment-Jalaali, and `react-moment-proptypes` from runtime, examples, tests, peer dependencies, and documentation; do not ship a dual Moment/Luxon compatibility layer.
- Introduce an internal Luxon adapter whose inputs and outputs are canonical ISO date strings; use Luxon for validation, comparison, arithmetic, Gregorian formatting, and locale-week data.
- Reject non-canonical strings and impossible dates at the public boundary. Treat values as date-only data, construct internal `DateTime` values in UTC, and always serialize back to `YYYY-MM-DD` so time zones and daylight-saving transitions cannot shift a selected day.
- Replace mutable Moment operations with immutable Luxon operations: `add/subtract` with `plus/minus`, setters with `set`, comparisons with `hasSame` or millisecond comparisons, and formatting with `toFormat`/`toLocaleString`.
- Normalize Moment's zero-based months and Sunday-based weekdays at the adapter boundary because Luxon months are 1-12 and weekdays are Monday=1 through Sunday=7.
- Parse typed input strictly with locale-aware `Intl` options implemented through the adapter, with canonical ISO input as an unconditional fallback; invalid or ambiguous input returns `null` through the existing controlled-component flow.
- Remove Moment/Luxon token constants from the public surface and add frozen, library-neutral default `Intl.DateTimeFormatOptions` constants instead.
- Derive locale week starts and localized labels from Luxon `Info`/`Intl`; consumers configure localization only through public props or formatter callbacks.
- Remove the old Moment-Jalaali demo integration without promoting it into the public contract. Preserve locale, numbering-system, RTL, and formatter/render callback extension points, but keep built-in formatting and arithmetic Gregorian-only.
- Validate public date props with a local canonical-ISO-date PropType validator and test that no Luxon `DateTime` instance is observable through any public callback or render prop.
- Keep the boundary compatible with a later internal migration to `Temporal.PlainDate`, which models timezone-free calendar dates but is not yet Baseline across major browsers. See [Temporal `PlainDate`](https://tc39.es/proposal-temporal/docs/plaindate.html) and the [MDN compatibility note](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate).

### Dependency and tooling replacement

| Remove | Replacement |
| --- | --- |
| Enzyme, adapter helpers, Cheerio | React Testing Library 16 and user-event 14 |
| Mocha, Chai, Sinon, mocha-wrap, sinon-sandbox, NYC | Vitest 4, its assertions/mocks, and V8 coverage |
| Karma, browser launchers, Webpack 4 and loaders | Vitest browser tests and Playwright 1.62 |
| Storybook 5 and obsolete addons | Storybook 10.5 with React/Vite, CSF3, autodocs, and accessibility addon |
| Babel CLI, Airbnb preset, legacy SVG/object transforms and runtime fallback | Vite 8; convert the six SVGs into normal React components |
| react-with-styles and all interfaces, Aphrodite, direction provider | Static CSS, CSS variables, and native `dir` handling |
| airbnb-prop-types | Local equivalents for the four validators used by the library |
| moment, moment-jalaali, react-moment-proptypes | Private Luxon 3.7 adapter and a canonical ISO-date validator |
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
2. Freeze the v22 public date contract: canonical `YYYY-MM-DD | null` values, Gregorian `Intl.DateTimeFormatOptions` or callbacks for formatting, and top-level `locale` and `numberingSystem` propagation. Add contract tests that reject Moment and Luxon instances at public boundaries.
3. Define and document narrow internal interfaces for the date adapter, portal/event helpers, class/style merging, and test render helpers. Decide their filenames and exports before delegation.
4. Add the minimum transitional Vitest/Vite scaffolding needed for foundation tests while retaining legacy tooling only where a test has not yet been migrated.

Gate 0: Sol can run one Vitest smoke test, build both module formats, inspect the packed file list, and give each worker a non-overlapping allowlist against frozen interfaces.

### Wave 1 — Independent foundations (three Luna-high workers)

#### Worker A: date foundation

Own only the new private date-adapter directory, the date-only utilities assigned by Sol, their utility tests, and the local canonical-date PropType validator.

- Implement strict canonical validation, UTC construction, ISO serialization, comparison, arithmetic, month/week generation, locale week data, and `Intl`-based formatting/parsing.
- Replace Moment utility behavior behind the frozen adapter interface without editing picker components, public exports, shared constants, or manifests.
- Add leap-year, invalid-date, month-boundary, weekday-index, locale, numbering-system, and real IANA DST-transition cases. Include at least `UTC`, `America/New_York`, `Europe/London`, `Australia/Brisbane`, and `Pacific/Apia`; do not model DST with a fixed UTC offset.

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
| A | `CalendarDay`, `CustomizableCalendarDay`, `CalendarWeek`, `CalendarMonth`, `CalendarMonthGrid`, and their tests/styles | ISO-only day rendering, month/week math through the adapter, preserved classes/RTL/visual states, and behavioral RTL tests |
| B | `DayPicker`, `DayPickerNavigation`, `DayPickerKeyboardShortcuts`, `KeyboardShortcutRow`, `DayPickerRangeController`, `DayPickerSingleDateController`, and their tests/styles | Modern lifecycles, Strict Mode-safe effects, ISO callbacks, keyboard/focus/navigation parity, and cleanup tests |
| C | `DateInput`, all `DateRangePicker*`, all `SingleDatePicker*`, and their tests/styles | Controlled ISO input/output, strict localized parsing, portal/outside-click/scroll behavior, formatter callbacks, null/error handling, and public-boundary tests |

Small icon components are assigned by Sol to exactly one cluster or retained for Sol integration. A worker may import another cluster only through the frozen props contract and must not edit that cluster.

Gate 2: Sol integrates clusters in the order calendar primitives, controllers, then public pickers; resolves shared shape/constant/export changes; aggregates CSS; and removes every remaining direct Moment or `react-with-styles` use. The full migrated unit suite, Strict Mode suite, SSR smoke suite, and production build must pass before cleanup.

### Wave 3 — Toolchain cleanup and packaging (Sol, serial)

1. Remove the legacy test/build/Storybook configurations, compatibility scripts, obsolete source helpers, Moment/Jalaali artifacts, and superseded dependencies.
2. Finalize Vite preserved-module CommonJS/ESM output, conditional exports, the CSS alias, compatibility wrappers, peer ranges, side-effect metadata, and npm scripts.
3. Regenerate `package-lock.json`, run Knip, inspect deprecated transitive packages, and confirm that the production dependency allowlist contains only `prop-types` and private `luxon`.
4. Convert remaining examples and stories, then update migration documentation without introducing Luxon objects or tokens into examples.

Gate 3: a clean checkout can run `npm ci`, lint, unit tests, coverage, production build, Storybook build, and `npm pack`; no removed dependency name appears in runtime source, examples, tests, or published files except migration documentation.

### Wave 4 — Independent verification (three Luna-high reviewers)

- Reviewer A owns date correctness verification: fuzz valid date ranges, leap years, Gregorian locale parsing, numbering systems, and the five-zone DST matrix. This reviewer adds tests only in a dedicated verification directory.
- Reviewer B owns UI verification: Chromium/Firefox/WebKit flows, accessibility, keyboard-only behavior, focus restoration, RTL, responsive layouts, portals, and Chromium visual snapshots.
- Reviewer C owns package verification: React 18/19 consumer fixtures, Node 22/24, CommonJS/ESM/deep imports/CSS, lockfile and Knip audits, Storybook, and tarball contents.
- Reviewers do not fix implementation code. They report reproducible failures to Sol, who assigns a narrowly scoped fix to the original owner or implements the integration fix directly.

Gate 4: Sol runs the entire CI matrix from a clean checkout, confirms coverage thresholds, reviews the package diff and dependency audit, and publishes `22.0.0-rc.0` only after every reviewer report is resolved.

### Definition of done

- React 18 and 19 pass in Strict Mode on Node 22 and 24 with no lifecycle, unmount-update, listener-leak, or unhandled-console warnings.
- Every public date value and callback is library-neutral; Moment and Luxon objects and formatting tokens are absent from the public API.
- Date-only behavior survives the locale, leap-year, month-boundary, and real timezone/DST matrices without selected-day drift.
- Existing CSS classes and supported import paths remain compatible, while removed styling interfaces fail only in the documented v22 manner.
- Unit, SSR, browser, accessibility, visual, Storybook, build, dependency, and packed-consumer checks pass from a clean checkout.
- The release candidate includes migration guides for dates, formatting, styling, removed non-Gregorian integration, imports, and removed APIs.

## Test, CI, and Release Plan

- Convert utility tests directly to Vitest and rewrite Enzyme component tests around rendered behavior instead of component instances, state, or private methods.
- Cover controlled ISO-string date selection, null handling, impossible/non-canonical input rejection, range rules, month and weekday index conversion, strict Gregorian localized parsing, `Intl` formatting and callbacks, numbering systems, leap years, daylight-saving boundaries, month navigation, keyboard navigation, focus restoration, outside clicks, portals, scroll locking, responsive positioning, touch behavior, locale changes, RTL, and all orientation variants.
- Render the component suite inside `StrictMode`; fail on React lifecycle warnings, state updates after unmount, leaked listeners, or unhandled console errors.
- Add SSR smoke tests proving root imports and component rendering do not access `window` or `document` during module evaluation.
- Add Playwright tests in Chromium, Firefox, and WebKit; keep visual snapshots in Chromium for default, portal, RTL, vertical, selected-range, disabled, and responsive states.
- Run axe accessibility checks and keyboard-only flows for every public picker.
- Enforce at least 90% statements/lines/functions and 85% branch coverage.
- Test CI matrices on Node 22 and 24 with React 18 and 19.
- Run lint, dependency checks, unit tests, browser tests, Storybook build, production build, and `npm pack` validation.
- Install the packed tarball into isolated CommonJS and ESM fixtures and verify root, constants, initialize, CSS, theme, and representative deep imports.
- Replace legacy workflows with supported official GitHub actions, weekly Dependabot updates, GitHub Pages Storybook deployment, and an approval-gated npm trusted-publishing workflow using provenance.
- Publish `22.0.0-rc.0` first, validate the package fixtures and hosted Storybook, then publish `22.0.0` with a Moment-to-ISO-string migration guide, formatting/styling migration guides, and dependency audit report.

## Assumptions

- No conversion to TypeScript or hooks-only components is included; those would add risk without being required for React 18.
- React versions after 19 are added to the peer range only after passing the same CI matrix.
- Canonical `YYYY-MM-DD` strings are the only supported public date values in v22; Moment users remain on v21 until they migrate.
- Moment and Luxon formatting strings are not accepted by v22; formatting uses `Intl.DateTimeFormatOptions` or callbacks, and `toMomentObject` is removed without a library-specific replacement.
- Luxon is an internal implementation detail and may be replaced later without changing the public interface.
- Existing visual behavior and CSS class hooks are compatibility requirements; custom `react-with-styles` interface registration is intentionally discontinued.
- IE and other obsolete browsers are out of scope.
