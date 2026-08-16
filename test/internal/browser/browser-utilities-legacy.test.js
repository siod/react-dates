import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderHookStrict } from '../../helpers/index.js';
import classNamesUtil, {
  bem,
  cx,
  mergeClassNames,
  rtlClassName,
} from '../../../src/internal/browser/classNames.js';
import mergeInlineStyles, { mergeStyles } from '../../../src/internal/browser/inlineStyles.js';
import * as raf from '../../../src/internal/browser/raf.js';
import lockScroll, { disableScroll, enableScroll } from '../../../src/internal/browser/scrollLock.js';
import subscribeUtil, { addEventListener } from '../../../src/internal/browser/subscribe.js';
import throttle from '../../../src/internal/browser/throttle.js';
import isTouchDeviceUtil from '../../../src/internal/browser/touch.js';
import isTransitionEndSupportedUtil, {
  onTransitionEnd,
} from '../../../src/internal/browser/transitionEnd.js';
import useEventListener from '../../../src/internal/browser/useEventListener.js';

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
const originalTouchPoints = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
const originalMsTouchPoints = Object.getOwnPropertyDescriptor(navigator, 'msMaxTouchPoints');
const originalTouchStart = Object.getOwnPropertyDescriptor(window, 'ontouchstart');
const originalTransitionEvent = Object.getOwnPropertyDescriptor(window, 'TransitionEvent');

function restoreDescriptor(target, name, descriptor) {
  if (descriptor) Object.defineProperty(target, name, descriptor);
  else delete target[name];
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restoreDescriptor(window, 'matchMedia', originalMatchMedia);
  restoreDescriptor(navigator, 'maxTouchPoints', originalTouchPoints);
  restoreDescriptor(navigator, 'msMaxTouchPoints', originalMsTouchPoints);
  restoreDescriptor(window, 'ontouchstart', originalTouchStart);
  restoreDescriptor(window, 'TransitionEvent', originalTransitionEvent);
});

describe('browser class and style utilities', () => {
  it('merges class names deterministically and exposes aliases', () => {
    expect(classNamesUtil('alpha', false, ['beta', ['gamma']], null, 7)).toBe('alpha beta gamma 7');
    expect(mergeClassNames).toBe(classNamesUtil);
    expect(cx).toBe(classNamesUtil);
    expect(classNamesUtil()).toBe('');
  });

  it('builds BEM and RTL class names from string or object modifiers', () => {
    expect(bem('button')).toBe('button');
    expect(bem('button', 'icon', { active: true, disabled: false })).toBe(
      'button__icon button__icon--active',
    );
    expect(bem('button', null, 'large')).toBe('button button--large');
    expect(rtlClassName('button', true)).toBe('button button--rtl');
    expect(rtlClassName('button', false)).toBe('button');
  });

  it('merges inline styles without mutating source objects and exposes its alias', () => {
    const base = { color: 'red', padding: 2 };
    const override = { color: 'blue', margin: 1 };
    const merged = mergeInlineStyles(base, null, false, override);

    expect(merged).toEqual({ color: 'blue', padding: 2, margin: 1 });
    expect(base).toEqual({ color: 'red', padding: 2 });
    expect(mergeStyles).toBe(mergeInlineStyles);
  });
});

describe('requestAnimationFrame fallbacks', () => {
  it('schedules and cancels through the timeout fallback', () => {
    vi.useFakeTimers();
    const originalRequest = window.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    window.requestAnimationFrame = undefined;
    window.cancelAnimationFrame = undefined;

    const callback = vi.fn();
    const id = raf.requestAnimationFrameSafe(callback);
    vi.advanceTimersByTime(15);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith(expect.any(Number));

    const cancelled = raf.requestAnimationFrameSafe(callback);
    raf.cancelAnimationFrameSafe(cancelled);
    vi.advanceTimersByTime(16);
    expect(callback).toHaveBeenCalledTimes(1);

    const scheduledCallback = vi.fn();
    const cancel = raf.default(scheduledCallback);
    cancel();
    cancel();
    vi.advanceTimersByTime(16);
    expect(scheduledCallback).not.toHaveBeenCalled();

    window.requestAnimationFrame = originalRequest;
    window.cancelAnimationFrame = originalCancel;
  });
});

describe('scroll lock and DOM subscriptions', () => {
  it('keeps nested scroll locks until the last idempotent cleanup', () => {
    const target = document.createElement('div');
    target.style.overflow = 'auto';

    const first = lockScroll(target);
    const second = disableScroll(target);
    expect(target.style.overflow).toBe('hidden');

    first();
    first();
    expect(target.style.overflow).toBe('hidden');

    enableScroll(second);
    expect(target.style.overflow).toBe('auto');
    enableScroll(second);
  });

  it('subscribes, dispatches, and removes a listener exactly once', () => {
    const target = document.createElement('button');
    const listener = vi.fn();
    const remove = subscribeUtil(target, 'click', listener);

    fireEvent.click(target);
    expect(listener).toHaveBeenCalledTimes(1);
    remove();
    remove();
    fireEvent.click(target);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(addEventListener).toBe(subscribeUtil);
  });

  it('returns a harmless cleanup for invalid subscription inputs', () => {
    expect(() => subscribeUtil(null, 'click', vi.fn())()).not.toThrow();
    expect(() => subscribeUtil(document.body, 'click', null)()).not.toThrow();
  });
});

describe('throttle timing controls', () => {
  it('runs leading work immediately and trailing work with the latest arguments', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:01.000Z'));
    const callback = vi.fn();
    const throttled = throttle(callback, 100);

    throttled('first');
    throttled('second');
    throttled('latest');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    vi.advanceTimersByTime(99);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('latest');
  });

  it('supports leading=false, trailing=false, cancel, and flush', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:01.000Z'));

    const trailingCallback = vi.fn();
    const trailing = throttle(trailingCallback, 100, { leading: false });
    trailing('value');
    expect(trailingCallback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(trailingCallback).toHaveBeenCalledWith('value');

    const cancelledCallback = vi.fn();
    const cancelled = throttle(cancelledCallback, 100);
    cancelled('discard');
    cancelled.cancel();
    vi.advanceTimersByTime(100);
    expect(cancelledCallback).toHaveBeenCalledTimes(1);

    const flushedCallback = vi.fn();
    const flushed = throttle(flushedCallback, 100);
    vi.advanceTimersByTime(100);
    flushed('flush-me');
    expect(flushed.flush()).toBeUndefined();
    expect(flushedCallback).toHaveBeenCalledWith('flush-me');

    const noTrailingCallback = vi.fn();
    const noTrailing = throttle(noTrailingCallback, 100, { trailing: false });
    noTrailing('first');
    noTrailing('discard');
    vi.advanceTimersByTime(100);
    expect(noTrailingCallback).toHaveBeenCalledTimes(1);
  });

  it('rejects non-function callbacks', () => {
    expect(() => throttle(null)).toThrow(TypeError);
  });
});

describe('touch and transition feature detection', () => {
  it('detects touch points and coarse pointers', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 2 });
    expect(isTouchDeviceUtil()).toBe(true);

    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    expect(isTouchDeviceUtil()).toBe(true);
  });

  it('returns false when matchMedia is unavailable or throws', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
    delete window.ontouchstart;
    delete window.matchMedia;
    expect(isTouchDeviceUtil()).toBe(false);

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => { throw new Error('unsupported'); }),
    });
    expect(isTouchDeviceUtil()).toBe(false);
  });

  it('detects transition support and cleans up transition listeners', () => {
    delete window.TransitionEvent;
    expect(isTransitionEndSupportedUtil()).toBe(false);
    Object.defineProperty(window, 'TransitionEvent', { configurable: true, value: function TransitionEvent() {} });
    expect(isTransitionEndSupportedUtil()).toBe(true);

    const target = document.createElement('div');
    const listener = vi.fn();
    const remove = onTransitionEnd(target, listener);
    target.dispatchEvent(new Event('transitionend'));
    expect(listener).toHaveBeenCalledTimes(1);
    remove();
    remove();
    target.dispatchEvent(new Event('transitionend'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('useEventListener', () => {
  it('keeps the latest callback, then cleans up on unmount', () => {
    const target = document.createElement('div');
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHookStrict(
      ({ listener }) => useEventListener(target, 'custom', listener),
      { initialProps: { listener: first } },
    );

    target.dispatchEvent(new Event('custom'));
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ listener: second });
    target.dispatchEvent(new Event('custom'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unmount();
    target.dispatchEvent(new Event('custom'));
    expect(second).toHaveBeenCalledTimes(1);
  });
});
