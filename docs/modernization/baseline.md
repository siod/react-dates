# Modernization Baseline

- Source commit: `0296a2b23f9289aaef14d0eecd9cde426c4ca9c0`
- Runtime: Node `22.23.2`, npm `10.9.8`
- Lockfile: absent because the repository disabled package-lock generation.
- Installed tree: absent at branch creation.
- Legacy install: stopped after more than one minute without completion. npm had already emitted numerous deprecation warnings, including unsupported packages and packages with known public vulnerabilities.
- Legacy tests/build: not runnable before migration because the dependency installation did not complete. This is a recorded baseline failure, not a passing compatibility baseline.
- Public root exports: captured from `src/index.js`; v22 intentionally removes only `toMomentObject` and changes all public date values to Luxon `DateTime` instances.
- Compatibility artifacts to preserve: root, constants and initialize wrappers; `lib` and `esm` trees; `lib/css/_datepicker.css`; `Pure*` exports; documented CSS class names. The `DefaultTheme` deep import is intentionally removed because runtime JavaScript theme registration no longer exists.

The modernization branch must replace this non-reproducible baseline with a committed lockfile and clean-checkout CI.
