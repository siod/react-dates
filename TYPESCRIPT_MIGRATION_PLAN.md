# TypeScript Migration Plan

## Objective

Migrate `@siod/react-dates` from JavaScript and runtime PropTypes to a strict
TypeScript implementation with bundled declarations, without changing picker
behavior, Luxon semantics, styling, supported component/import paths, or the
React 18/19 compatibility contract. Publish the completed migration directly as
v23 because the newly released fork has no established consumer base requiring a
transitional v22 types release.

The v23 break is limited to removing `DateRangePickerShape` and
`SingleDatePickerShape` from the package root, component PropTypes and their
development warnings, the custom PropTypes helpers, and the `prop-types`
production dependency. PropTypes may remain temporarily between implementation
waves, but no intermediate release will contain both public type systems.

## Baseline

- Branch: `typescript`, created from `master` at `820baef`.
- Source: 113 `.js`/`.jsx` modules, including 24 components and approximately
  7,459 component lines.
- Components: 14 class components and 10 function/icon components.
- Tests: 48 files and approximately 7,183 lines, plus 15 examples and stories.
- Public root: 12 components, two runtime shape objects, and six date utilities.
- Packaging: preserved CommonJS modules in `lib/`, preserved ESM modules in
  `esm/`, root compatibility wrappers, `constants` and `initialize` subpaths,
  CSS exports, and wildcard `lib/*` and `esm/*` deep imports.
- Types: no bundled declarations or `types` export currently exist.
- Runtime validation: `prop-types` is the only production dependency. Custom
  validators cover valid Luxon values, mutually exclusive props, exact prop
  keys, and finite non-negative integer constraints.
- The Vite, Vitest, ESLint, and Knip file globs currently cover only JavaScript
  and JSX.

Record a fresh machine-readable baseline before implementation: current root
exports, constants, supported deep imports, packed file list, CJS/ESM fixture
results, CSS hashes, unit/coverage results, browser results, Storybook build,
and React 18/19 CI results.

## Contract Decisions

### Public types

Export named types from the package root in v23. At minimum define:

- `DateRangePickerProps` and `SingleDatePickerProps`.
- Props for every root-exported component and controller.
- `DateRange`, `FocusedInput`, `Disabled`, `DayOfWeek`, `Modifier`, and
  `Modifiers`.
- `DateFormat`, defined as `Intl.DateTimeFormatOptions` or a formatter receiving
  a Luxon `DateTime` and returning a string.
- Types for date predicates, selection callbacks, focus callbacks, navigation
  callbacks, phrases, render props, month rendering, and style injection.

Use Luxon `DateTime | null` at the same boundaries as v22.0.0. Types must not accept
Moment, native `Date`, strings, or formatting tokens. Callback types must describe
their actual payloads rather than using `Function`, broad objects, or `any`.

Model `renderMonthText` and `renderMonthElement` as a mutually exclusive union.
Use literal unions for focus, disabled side, orientation, anchor, opening,
navigation, icon, and calendar-info positions. Do not expose branded numeric
types for non-negative integers; ordinary numbers remain ergonomic for consumers.

### Runtime validation

TypeScript does not validate JavaScript callers, DateTime validity, numeric
ranges, or runtime spreads. Apply this policy:

- Retain a component's current PropTypes only until that component has a complete
  TypeScript contract and its behavioral tests pass; remove both in the same
  cluster integration before release.
- Remove `DateRangePickerShape` and `SingleDatePickerShape` as runtime exports in
  v23 rather than building a deprecation release no consumers need.
- Preserve `withStyles` default normalization while temporary PropTypes coexist
  with the new types. Do not rely on React 19 to apply function-component
  `defaultProps`.
- Keep lightweight explicit runtime guards only where invalid data could corrupt
  calendar state or date arithmetic; reuse `isDateTime` rather than introducing
  a schema-validation dependency.
- Treat the loss of development warnings for extra props, mutually exclusive
  renderers, and numeric ranges as part of the documented v23 break.

No migration step may change defaults, callback timing, focus behavior, date
selection, hovering, keyboard behavior, portals, CSS classes, or DOM structure.

### TypeScript strictness

Use a transitional mixed-source configuration with `allowJs: true` and
`checkJs: false`, then remove `allowJs` when `src/` is fully converted. Enable
`strict`, `strictNullChecks`, `noImplicitAny`, `noImplicitOverride`,
`useUnknownInCatchVariables`, `forceConsistentCasingInFileNames`, and
`isolatedModules`. Add `noUncheckedIndexedAccess` after the shared modifier,
style, and visible-day map types have stabilized.

Do not accept unreviewed `any`, `@ts-ignore`, declaration stubs that erase public
types, or casts whose only purpose is to silence a design mismatch. External
unknown values start as `unknown` and are narrowed. Any unavoidable exception
must carry a local explanation and a regression test.

## Build and Package Design

### Tooling

Add direct development dependencies for TypeScript, Node types, React 18/19
compatible types, React DOM types, Luxon types, and TypeScript-aware ESLint. Do
not rely on the transitive TypeScript installation already present through other
tools.

Add:

- `tsconfig.json` for strict source checking.
- `tsconfig.build.json` for declaration-only output.
- `npm run typecheck`.
- `npm run build:types`.

Vite remains responsible for JavaScript output and must discover `.ts` and
`.tsx` alongside transitional `.js` and `.jsx` files. `tsc` performs type
checking and declaration emission; Vite must never be treated as a type checker.
Update Vitest coverage, ESLint, import resolution, and Knip globs as soon as the
first source file is renamed so converted files cannot silently escape checks.

### Declarations and exports

Start with one canonical declaration tree beside the CommonJS output:

```text
lib/index.d.ts
lib/constants.d.ts
lib/components/CalendarDay.d.ts
lib/internal/...
```

Generate declarations after both Vite runtime builds because each Vite build
uses `emptyOutDir`. Add `"types": "./lib/index.d.ts"` and put a `types` condition
before runtime conditions for the root, `constants`, `initialize`, and every
supported `lib/*` and `esm/*` wildcard form. Map ESM deep imports to the same
canonical declaration tree unless the Gate 0 resolution spike proves separate
ESM declarations are required.

Preserve all runtime paths, root CommonJS wrappers, `esm/package.json`, CSS
exports, and intentional null exports. The declaration build must represent
default HOC exports, `WrappedComponent`/`Pure*` named exports, root utilities,
and both extensionless and `.js` deep imports.

Current relative source imports are mostly extensionless. Gate 0 must choose one
repository-wide NodeNext-safe strategy:

1. Prefer explicit `.js` relative specifiers in TypeScript source and let the
   compiler/Vite resolve the corresponding `.ts`/`.tsx` inputs.
2. Use a deterministic declaration post-processor only if the preferred approach
   cannot preserve the existing runtime build.

Do not proceed to bulk conversion until packed consumers prove the chosen layout
under both `NodeNext` and `Bundler` resolution.

### Type dependency placement

The emitted declarations expose React and Luxon types. During Gate 0:

- Add `@types/react` as an optional peer spanning React 18 and 19, with a direct
  development copy for the repository. Document that TypeScript React consumers
  provide the type major matching their React installation; each packed type
  fixture installs its matching baseline explicitly.
- Keep `@types/react-dom` and `@types/node` development-only unless emitted public
  declarations actually reference them. TypeScript React DOM fixtures install
  their matching React DOM type baseline as consumer dependencies.
- Since the installed Luxon package does not bundle declarations and Luxon types
  appear directly in the public API, add `@types/luxon` as a regular dependency.
  Do not copy or replace its declarations locally.

Fail the gate if a JavaScript-only consumer receives avoidable type-peer warnings,
if the tarball forces one React type major into consumers of the other major, or
if declarations require any undeclared type provider beyond the documented
optional React type peer.

## Implementation Waves

### Agent coordination

Use one lead and up to three Luna-high subagents. The lead owns architecture,
shared types, manifests, lockfiles, exports, compiler/build configuration,
integration, commits, and releases. Luna-high workers receive bounded file
allowlists and never redefine public contracts or edit shared package surfaces.

Only the lead commits or pushes. Each worker handoff must list changed files,
commands and results, type assertions or suppressions introduced, unresolved
risks, and requested shared changes. Integrate and pass the wave gate before
starting work that depends on that wave.

### Wave 0 — Contract and packaging spike (lead, serial)

1. Record the baseline and freeze public runtime behavior and exports except for
   the two explicitly removed shape objects.
2. Define the canonical public types and callback signatures from implementation
   call sites and tests, not from broad PropTypes such as `func` or `object`.
3. Add the mixed-source TypeScript configuration and type-aware lint/tool globs.
4. Prototype declarations for the root, `constants`, `initialize`, one function
   component, one class component, one HOC export, one utility, and representative
   `lib/*`/`esm/*` deep imports.
5. Add packed TypeScript fixtures for NodeNext CommonJS and Bundler ESM, initially
   using React 19 types and then React 18 types.
6. Freeze the declaration layout, relative-import convention, and HOC typing only
   after those fixtures pass.

Gate 0:

- `npm run typecheck` is independent of the Vite build.
- Both runtime trees and the prototype declarations survive a clean build.
- Packed CJS and ESM runtime fixtures still pass.
- Packed NodeNext and Bundler type fixtures resolve root and deep imports.
- The tarball contains expected declarations and no source/config leakage.
- Existing root exports and CSS output are unchanged.

### Wave 1 — Independent foundations (three Luna-high workers)

Worker A owns `src/internal/date/**` and date-focused `src/utils/**`. Convert Luxon
validation, comparisons, serialization, locale formatting, parsing, calendar
projection, and visible-day utilities. Preserve zone behavior and existing
invalid-input return values. Keep the transitional DateTime PropType wrapper only
until all component consumers have migrated; retain `isDateTime` as a normal
runtime guard.

Worker B owns `src/internal/browser/**`, `src/internal/styles/**`,
`src/internal/pickComponentProps.*`, `src/svg/**`, and icon-only components. Type
DOM resources, SSR guards, listeners, timers, refs, inline styles, static theme
tokens, the `withStyles` HOC, and `forwardRef`. The public HOC input must omit
injected `styles`, `theme`, and `css`, while `WrappedComponent` remains typed.

Worker C owns only the new packed TypeScript fixtures and compile-time contract
tests. Cover positive and negative root imports, callback payloads, Luxon
nullability, literals, renderer mutual exclusion, CJS/ESM deep imports, and
React 18/19 type baselines. Worker C reports package/config needs to the lead.

The lead owns `src/types/**`, `src/constants.*`, `src/defaultPhrases.*`, public
entrypoints, all manifests/configuration, and cross-foundation fixes.

Gate 1:

- Migrated files pass strict checking without unreviewed `any` or suppressions.
- Date utility and internal browser/style tests pass unchanged.
- SSR import and cleanup tests pass.
- HOC defaults and refs behave identically under React 18 and 19.
- Runtime CJS/ESM and compile-time packed fixtures pass together.

### Wave 2 — Leaf components and inputs

Run only independent clusters in parallel.

Worker A owns `CalendarWeek`, `KeyboardShortcutRow`, `DayPickerNavigation`,
`CalendarDay`, `CustomizableCalendarDay`, `CalendarMonth`, `CalendarMonthGrid`,
and `DayPickerKeyboardShortcuts`, plus directly matching tests when import renames
are required. Convert leaf components before month/grid components. Type DOM refs,
`Set<Modifier>`, date callbacks, month renderers, and keyboard handlers. Remove
each migrated component's PropTypes after its TypeScript contract and runtime
tests pass.

Worker B owns `DateInput`, `DateRangePickerInput`, `SingleDatePickerInput`,
`DateRangePickerInputController`, and `SingleDatePickerInputController`, plus
directly matching tests when needed. Type localized formatting/parsing,
controlled focus, nullable dates, disabled unions, DOM input refs, and change
payloads. Preserve the three function-component default behaviors explicitly and
remove their PropTypes after the typed defaults are verified in React 18 and 19.

Worker C remains focused on consumer type fixtures and adds declarations for
representative newly migrated deep components; it does not edit component code.

Gate 2:

- Calendar and input targeted tests pass with no snapshot or DOM changes.
- Function-component defaults match in React 18 and 19.
- Public and internal callback types match observed runtime calls.
- Deep declarations for each migrated cluster compile from the packed tarball.
- Full unit coverage remains above the existing thresholds.

### Wave 3 — DayPicker, controllers, and public pickers

Integrate Wave 2 before starting this wave.

Worker A exclusively owns `DayPicker`. Type its state, transition modes, focus
state, month/week caches, nested modifier maps, layout refs, throttled keyboard
events, and navigation callbacks. Do not combine this work with controllers.

After `DayPicker` is integrated, Worker B owns `DayPickerRangeController`,
`DayPickerSingleDateController`, `DateRangePicker`, and `SingleDatePicker`. Type
selection state, visible-day maps, predicate modifiers, portals, shell refs,
controlled callback payloads, and named `Pure*` exports. Each worker removes
PropTypes from its completed components after focused tests pass.

Worker C owns source-import updates and type-focused tests under `test/` that do
not overlap Worker A or B's matching runtime tests. It must not rewrite behavioral
tests merely to satisfy types.

After the component workers are integrated, the lead removes
`DateRangePickerShape`, `SingleDatePickerShape`, phrase and DateTime PropType
wrappers, the custom PropTypes combinators, PropTypes copying in `withStyles`, and
the `prop-types` dependency. Preserve default normalization, ref forwarding,
`WrappedComponent`, caller-visible style-prop omission, and defensive
`isDateTime` checks. Replace tests that directly execute PropTypes with tests for
the retained runtime guards and exported TypeScript contracts.

Gate 3:

- All production files under `src/` are `.ts` or `.tsx` and `allowJs` can be
  removed for source checking.
- No production or development source imports `prop-types`, no declaration
  mentions PropTypes validators, and the packed dependency audit contains no
  `prop-types`.
- Runtime root exports match v22.0.0 except for the two explicitly removed shape
  objects.
- Strict typecheck, lint, Knip, unit tests, coverage, SSR, Storybook, and all
  browser projects pass.
- React 18 and 19 runtime and type matrices pass.
- Public callbacks, defaults, CSS, focus, hovering, range selection, keyboard
  navigation, portals, and responsive behavior are unchanged.

### Wave 4 — v23 integration and release

The lead:

1. Converts examples and stories to TSX where that improves public API coverage;
   Playwright specifications may remain JavaScript when conversion adds no type
   value.
2. Replaces README PropTypes pseudo-signatures with actual exported TypeScript
   types and adds JavaScript and TypeScript usage examples.
3. Adds a v23 migration note for the removed runtime shape exports and changed
   JavaScript development-warning behavior.
4. Finalizes declaration maps, package exports, type dependency placement, build
   ordering, CI typecheck, and packed consumer matrices.
5. Publishes `23.0.0-rc.0`, validates runtime and declarations from npm, resolves
   release-candidate findings, and then publishes `23.0.0`.

Gate 4:

- Runtime root exports differ from v22.0.0 only by the documented removal of
  `DateRangePickerShape` and `SingleDatePickerShape`.
- No package file or dependency contains the retired PropTypes implementation.
- The installed npm tarball typechecks without workspace leakage in all fixtures.
- JavaScript-only installation and use remain warning-free.
- No declaration exposes private HOC implementation details or unintended `any`.

## Independent Verification

Use three Luna-high reviewers after implementation. Reviewers initially make no
production edits.

- Type/API reviewer: compile positive and negative consumer cases, inspect every
  root export and public callback, verify nullability and literal unions, and
  check for leaked `any` or private types.
- Package reviewer: inspect the tarball, declaration maps and conditional exports;
  test NodeNext/Bundler, CJS/ESM, extensionless/`.js` deep imports, React 18/19,
  Node 22/24, and clean dependency installation.
- Runtime reviewer: rerun unit, SSR, Storybook, accessibility, browser, keyboard,
  focus, portal, RTL, range-hover, timezone/DST, and visual regression suites and
  compare CSS and public runtime exports with the baseline.

The lead resolves reviewer findings through narrowly owned fixes and reruns the
full relevant gate. Reviewers do not weaken declarations or behavioral tests to
make a failure disappear.

## Definition of Done

- All production source is strict TypeScript with no unreviewed `any`, ignored
  errors, or declaration-only facades hiding untyped implementation.
- Root, `constants`, `initialize`, CommonJS, ESM, supported deep imports, CSS,
  default/named exports, and `Pure*` exports retain their documented runtime
  behavior.
- Bundled declarations work from the installed package under React 18 and 19,
  NodeNext and Bundler resolution, and CommonJS and ESM consumers.
- Every public date boundary uses Luxon `DateTime | null`; callback and render-prop
  signatures reflect actual runtime behavior.
- Build, typecheck, lint, dependency audit, unit, coverage, SSR, Storybook,
  accessibility, Playwright, visual, and packed-consumer checks pass in CI.
- `23.0.0-rc.0` is validated from npm before `23.0.0` is published with the
  PropTypes surface and dependency removed and the two shape-export removals
  documented.
