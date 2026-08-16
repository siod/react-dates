import React, { StrictMode } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  OutsideClickHandler,
  Portal,
  classNames,
  isTouchDevice,
  lockScroll,
  scheduleAnimationFrame,
  subscribe,
  throttle,
} from '../../src/internal/browser';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('browser foundations', () => {
  it('imports and renders safely with a lazily-owned portal', () => {
    const { unmount } = render(<StrictMode><Portal><span>portal</span></Portal></StrictMode>);
    expect(document.body.textContent).toContain('portal');
    const owned = [...document.body.children].filter((node) => node.textContent === 'portal');
    expect(owned).toHaveLength(1);
    unmount();
    expect([...document.body.children].filter((node) => node.textContent === 'portal')).toHaveLength(0);
  });

  it('cleans subscriptions and outside-click listeners idempotently', () => {
    const callback = vi.fn();
    const remove = subscribe(document, 'click', callback);
    remove();
    remove();
    fireEvent.click(document.body);
    expect(callback).not.toHaveBeenCalled();

    const outside = vi.fn();
    const { getByText, unmount } = render(
      <StrictMode><OutsideClickHandler onOutsideClick={outside}><span>inside</span></OutsideClickHandler></StrictMode>,
    );
    fireEvent.mouseDown(getByText('inside'));
    fireEvent.mouseDown(document.body);
    expect(outside).toHaveBeenCalledTimes(1);
    unmount();
    fireEvent.mouseDown(document.body);
    expect(outside).toHaveBeenCalledTimes(1);
  });

  it('supports touch fallbacks and cancels animation work', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn(() => ({ matches: true }));
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
    expect(isTouchDevice()).toBe(true);
    window.matchMedia = original;

    const callback = vi.fn();
    const cancel = scheduleAnimationFrame(callback);
    cancel();
    cancel();
    expect(callback).not.toHaveBeenCalled();
  });

  it('cancels throttled trailing calls and restores nested scroll locks', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const fn = throttle(callback, 20);
    fn();
    fn.cancel();
    vi.advanceTimersByTime(30);
    expect(callback).toHaveBeenCalledTimes(1);
    const first = lockScroll(document.documentElement);
    const second = lockScroll(document.documentElement);
    expect(document.documentElement.style.overflow).toBe('hidden');
    first();
    expect(document.documentElement.style.overflow).toBe('hidden');
    second();
    expect(document.documentElement.style.overflow).toBe('');
    vi.useRealTimers();
  });

  it('merges class names predictably', () => {
    expect(classNames('one', false, ['two', null, ['three']])).toBe('one two three');
  });
});
