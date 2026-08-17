import { describe, expect, it } from 'vitest';

import {
  installConsoleGuard,
  installRuntimeErrorGuard,
  installUnhandledErrorGuard,
} from '../helpers/index.js';

describe('runtime error harness', () => {
  it('captures console warnings and restores the original method', () => {
    const original = console.warn;
    const guard = installConsoleGuard();

    console.warn('harness warning');

    expect(guard.records).toHaveLength(1);
    expect(guard.records[0].type).toBe('console.warn');
    guard.restore();
    expect(console.warn).toBe(original);
  });

  it('captures unhandled browser events on an SSR-safe target', () => {
    const listeners = new Map();
    const target = {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      removeEventListener(type) {
        listeners.delete(type);
      },
    };
    const guard = installUnhandledErrorGuard({ target });

    listeners.get('unhandledrejection')({ reason: new Error('rejected') });

    expect(guard.records).toHaveLength(1);
    expect(() => guard.assertClean()).toThrow(/rejected/);
    guard.restore();
    expect(listeners.size).toBe(0);
  });

  it('combines guards and exposes records collected before assertion', () => {
    const target = { addEventListener() {}, removeEventListener() {} };
    const guard = installRuntimeErrorGuard({ unhandled: { target } });

    console.error('combined guard');

    expect(guard.records.some(({ type }) => type === 'console.error')).toBe(true);
    guard.restore();
  });
});
