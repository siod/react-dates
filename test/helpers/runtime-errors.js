function formatValue(value) {
  if (value instanceof Error) return value.stack || value.message;

  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function makeAssertionError(label, records) {
  const details = records
    .map(({ type, args }) => `${type}: ${args.map(formatValue).join(' ')}`)
    .join('\n');

  return new Error(`${label} captured unexpected runtime output:\n${details}`);
}

/**
 * Fail a test when React or application code writes an unexpected warning.
 * The original console methods are always restored by restore().
 */
export function installConsoleGuard({
  methods = ['error', 'warn'],
  allow = [],
} = {}) {
  const records = [];
  const originals = new Map();
  const allowed = (args) => allow.some((matcher) => (
    typeof matcher === 'function'
      ? matcher(args)
      : args.some((value) => String(value).includes(String(matcher)))
  ));

  methods.forEach((method) => {
    if (typeof console[method] !== 'function') return;

    originals.set(method, console[method]);
    console[method] = (...args) => {
      if (!allowed(args)) records.push({ args, type: `console.${method}` });
    };
  });

  const guard = {
    records,
    restore() {
      originals.forEach((original, method) => {
        console[method] = original;
      });
    },
    assertClean() {
      if (records.length > 0) throw makeAssertionError('Console guard', records);
    },
  };

  return guard;
}

/**
 * Capture browser error and unhandled-rejection events without suppressing
 * the normal event dispatch path. The returned guard is safe in SSR tests.
 */
export function installUnhandledErrorGuard({ target = globalThis } = {}) {
  const records = [];
  const onError = (event) => {
    records.push({
      args: [event.error || event.message || event],
      type: 'window.error',
    });
  };
  const onRejection = (event) => {
    records.push({
      args: [event.reason || event],
      type: 'window.unhandledrejection',
    });
  };

  target.addEventListener?.('error', onError);
  target.addEventListener?.('unhandledrejection', onRejection);

  return {
    records,
    restore() {
      target.removeEventListener?.('error', onError);
      target.removeEventListener?.('unhandledrejection', onRejection);
    },
    assertClean() {
      if (records.length > 0) {
        throw makeAssertionError('Unhandled-error guard', records);
      }
    },
  };
}

/** Install both guards and restore them together in afterEach/finally. */
export function installRuntimeErrorGuard(options = {}) {
  const consoleGuard = installConsoleGuard(options.console);
  const errorGuard = installUnhandledErrorGuard(options.unhandled);

  return {
    console: consoleGuard,
    unhandled: errorGuard,
    get records() {
      return [...consoleGuard.records, ...errorGuard.records];
    },
    restore() {
      errorGuard.restore();
      consoleGuard.restore();
    },
    assertClean() {
      consoleGuard.assertClean();
      errorGuard.assertClean();
    },
  };
}

/** Run a callback with a temporary runtime-error guard. */
export async function withRuntimeErrorGuard(callback, options = {}) {
  const guard = installRuntimeErrorGuard(options);

  try {
    const result = await callback(guard);
    guard.assertClean();
    return result;
  } finally {
    guard.restore();
  }
}
