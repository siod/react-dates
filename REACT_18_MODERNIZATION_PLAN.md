# React 18+ and Dependency Modernization Plan

## Summary

Release `react-dates` 22.0.0 as a major modernization:

- Require Node `>=22.22.2`.
- Support and test React 18 and React 19; declare peers as `^18.0.0 || ^19.0.0`.
- Preserve existing components, props, callbacks, Moment values, named exports, CSS classes, and documented import paths.
- Remove obsolete React compatibility code and every deprecated, abandoned, unused, or platform-redundant direct dependency.
- Retain Moment behind an internal adapter because it is officially a stable legacy project rather than abandoned; plan its eventual replacement separately. See the [Moment project status](https://momentjs.com/docs/).
- Make removal of custom `react-with-styles` interfaces the one intentional consumer-facing styling break.

## Public Contract and Packaging

- Preserve root exports plus `react-dates/constants`, `react-dates/initialize`, `react-dates/lib/css/_datepicker.css`, legacy `lib`/`esm` deep imports, `DefaultTheme`, and existing `Pure*` named exports.
- Keep `initialize` as a harmless compatibility module; consumers no longer need to call it.
- Add conditional package exports for CommonJS and ESM while retaining root compatibility wrappers.
- Build per-module ESM into `esm/` and CommonJS into `lib/` using Vite 8 with preserved modules and peer dependencies externalized.
- Add `module`, `exports`, `sideEffects`, `files`, and `engines` metadata. Add `react-dates/css` as a supported alias for the existing stylesheet.
- Use the following final production dependency allowlist:
  - Dependency: `prop-types@^15.8.1`.
  - Peers: `react`, `react-dom`, and `moment@^2.30.1`.
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

### Date abstraction

- Keep Moment-valued props and callbacks unchanged.
- Add an internal date adapter for construction, cloning, comparison, arithmetic, formatting, locale access, and validation; migrate direct Moment operations through it without exposing a new API.
- Replace `react-moment-proptypes` with a local validator based on `moment.isMoment`.
- Retain and update `moment-jalaali` only as a development compatibility fixture.

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
| consolidated-events, is-touch-device, react-outside-click-handler, react-portal, raf | Small native helpers and React DOM portal APIs |
| lodash, object.assign, object.values, color2k | Native/local utilities and precomputed theme colors |
| clean-css | Lightning CSS 1 |
| Airbnb ESLint config and styling plugin | ESLint 9 flat config with React, Hooks, JSX-a11y, and import-x plugins |
| git-directory-deploy, in-publish, safe-publish-latest | GitHub Pages actions and `prepublishOnly` validation |
| mkdirp, rimraf, cross-env, airbnb-js-shims, unused TypeScript | Node APIs or configuration-driven scripts |

- Run Knip in CI to reject unused dependencies and exports.
- Review the resulting full lockfile for deprecated or archived transitives; replace their owning top-level package until the lock contains no deprecated package entries.

## Test, CI, and Release Plan

- Convert utility tests directly to Vitest and rewrite Enzyme component tests around rendered behavior instead of component instances, state, or private methods.
- Cover controlled date selection, range rules, month navigation, keyboard navigation, focus restoration, outside clicks, portals, scroll locking, responsive positioning, touch behavior, locale changes, Moment/Jalaali compatibility, RTL, and all orientation variants.
- Render the component suite inside `StrictMode`; fail on React lifecycle warnings, state updates after unmount, leaked listeners, or unhandled console errors.
- Add SSR smoke tests proving root imports and component rendering do not access `window` or `document` during module evaluation.
- Add Playwright tests in Chromium, Firefox, and WebKit; keep visual snapshots in Chromium for default, portal, RTL, vertical, selected-range, disabled, and responsive states.
- Run axe accessibility checks and keyboard-only flows for every public picker.
- Enforce at least 90% statements/lines/functions and 85% branch coverage.
- Test CI matrices on Node 22 and 24 with React 18 and 19.
- Run lint, dependency checks, unit tests, browser tests, Storybook build, production build, and `npm pack` validation.
- Install the packed tarball into isolated CommonJS and ESM fixtures and verify root, constants, initialize, CSS, theme, and representative deep imports.
- Replace legacy workflows with supported official GitHub actions, weekly Dependabot updates, GitHub Pages Storybook deployment, and an approval-gated npm trusted-publishing workflow using provenance.
- Publish `22.0.0-rc.0` first, validate the package fixtures and hosted Storybook, then publish `22.0.0` with a migration guide and dependency audit report.

## Assumptions

- No conversion to TypeScript or hooks-only components is included; those would add risk without being required for React 18.
- React versions after 19 are added to the peer range only after passing the same CI matrix.
- Moment remains public and supported for this major, despite its maintenance status.
- Existing visual behavior and CSS class hooks are compatibility requirements; custom `react-with-styles` interface registration is intentionally discontinued.
- IE and other obsolete browsers are out of scope.
