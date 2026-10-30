# Dual-package declaration layout

## Why one declaration tree is unsafe

TypeScript assigns a module kind to declaration files. A `.d.ts` file is treated
as ESM when its nearest `package.json` contains `"type": "module"`; otherwise it
is treated as CommonJS. The declaration's module kind must agree with the
JavaScript file it describes.

`@siod/react-dates` publishes two JavaScript trees with different module kinds:

- `lib/` is CommonJS because the root `package.json` has no `"type": "module"`.
- `esm/` is ESM because `esm/package.json` declares `"type": "module"`.

A single canonical declaration such as `types/index.d.ts` has only one module
context. Pointing both the `require` and `import` conditions at that file can
therefore describe at most one runtime tree correctly. Under `NodeNext`, the
other condition may produce false named/default exports, CommonJS-to-ESM import
errors, or types that resolve in `Bundler` mode but fail for Node consumers.

This is a classification problem, not a difference in the public interfaces.
The declaration text can be identical while the files still need to exist under
both package scopes.

## Gate 0 layout

Gate 0 emits declarations beside the CommonJS runtime, normalizes relative
specifier extensions, and then copies the declarations beside the ESM runtime:

```text
lib/index.js                  CommonJS runtime
lib/index.d.ts                CommonJS declaration
lib/components/CalendarDay.js
lib/components/CalendarDay.d.ts

esm/package.json              { "type": "module" }
esm/index.js                  ESM runtime
esm/index.d.ts                ESM declaration
esm/components/CalendarDay.js
esm/components/CalendarDay.d.ts
```

The root export uses format-specific type conditions:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./esm/index.d.ts",
        "default": "./esm/index.js"
      },
      "require": {
        "types": "./lib/index.d.ts",
        "default": "./lib/index.js"
      }
    }
  }
}
```

The `types` condition precedes `default`, as required by TypeScript's conditional
exports guidance. The same pattern is used for `constants`, `initialize`, and
supported `lib/*` and `esm/*` deep imports.

## Why relative imports end in `.js`

The runtime files use `.js`, so relative imports retained in declarations must
also name `.js` files. Extensionless specifiers can work with bundler-specific
resolution but are invalid for Node ESM. Letting them escape into `esm/*.d.ts`
would make a package appear healthy in an application using
`moduleResolution: "bundler"` while failing in a `NodeNext` consumer.

Gate 0 uses `scripts/sync-declarations.mjs` to make this transformation
deterministic. It only rewrites relative specifiers and chooses either
`./file.js` or `./directory/index.js` from the emitted declaration tree.

## What would also be unsafe

Avoid broad ambient shims such as:

```ts
declare module '@siod/react-dates/*';
```

That declaration suppresses resolution errors by turning the matched imports
into `any`. It hides missing deep declarations instead of proving that the
published package is sound.

Avoid pointing both conditions at one file unless it uses a format-explicit
extension (`.d.cts` or `.d.mts`) that actually matches both corresponding
runtime entrypoints. One file cannot be both formats.

## Verification

The packed fixtures install the real tarball rather than importing repository
source. Each React 18 and React 19 fixture checks both resolution strategies:

```sh
npm run build
npm pack
REACT_DATES_TARBALL=./siod-react-dates-22.0.0.tgz npm run test:types:packed
npm run verify:typescript-gate0
```

The fixtures compile root and deep imports with `NodeNext` and `Bundler`. The
gate verifier also checks that both declaration trees are present and that
source/configuration files do not leak into the tarball.

## Primary references

- [TypeScript module format detection](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-format-detection)
- [TypeScript package `exports` resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)
- [TypeScript guidance for library declaration output](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html#considerations-for-bundling-libraries)
- [TypeScript 4.7 conditional `types` exports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#packagejson-exports-imports-and-self-referencing)
- [Node.js package module-kind rules](https://nodejs.org/api/packages.html#determining-module-system)
