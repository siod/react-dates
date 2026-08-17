import { afterEach, describe, expect, it } from 'vitest';

import disableScroll, {
  getScrollAncestorsOverflowY,
  getScrollParent,
} from '../../src/utils/disableScroll';
import getActiveElement from '../../src/utils/getActiveElement';
import isTransitionEndSupported from '../../src/utils/isTransitionEndSupported';

const originalTransitionEvent = Object.getOwnPropertyDescriptor(window, 'TransitionEvent');

afterEach(() => {
  document.body.replaceChildren();
  if (originalTransitionEvent) {
    Object.defineProperty(window, 'TransitionEvent', originalTransitionEvent);
  } else {
    delete window.TransitionEvent;
  }
});

function scrollContainer({ height, overflowY = 'auto' }) {
  const element = document.createElement('div');
  element.style.height = `${height}px`;
  element.style.overflowY = overflowY;
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: height });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: height });
  return element;
}

function buildScrollTree() {
  const outer = scrollContainer({ height: 100 });
  const inner = scrollContainer({ height: 100 });
  const content = document.createElement('div');
  const target = document.createElement('button');

  Object.defineProperty(outer, 'scrollHeight', { configurable: true, value: 500 });
  Object.defineProperty(inner, 'scrollHeight', { configurable: true, value: 400 });
  inner.append(content);
  content.append(target);
  outer.append(inner);
  document.body.append(outer);

  return { outer, inner, target };
}

describe('browser utility helpers', () => {
  describe('disableScroll', () => {
    it('finds the closest scroll parent and all scroll ancestors', () => {
      const { outer, inner, target } = buildScrollTree();

      expect(getScrollParent(target)).toBe(inner);
      const ancestors = getScrollAncestorsOverflowY(target);
      expect(ancestors.get(inner)).toBe('auto');
      expect(ancestors.get(outer)).toBe('auto');
      expect(ancestors.has(document.documentElement)).toBe(true);
    });

    it('disables every ancestor and restores each original overflow value', () => {
      const { outer, inner, target } = buildScrollTree();
      outer.style.overflowY = 'scroll';
      inner.style.overflowY = 'auto';
      const root = document.scrollingElement || document.documentElement;
      root.style.overflowY = 'visible';

      const enableScroll = disableScroll(target);
      expect(outer.style.overflowY).toBe('hidden');
      expect(inner.style.overflowY).toBe('hidden');
      expect(root.style.overflowY).toBe('hidden');

      enableScroll();
      expect(outer.style.overflowY).toBe('scroll');
      expect(inner.style.overflowY).toBe('auto');
      expect(root.style.overflowY).toBe('visible');
    });
  });

  it('returns the document active element through the public utility', () => {
    const target = document.createElement('button');
    document.body.append(target);
    target.focus();

    expect(getActiveElement()).toBe(target);
  });

  describe('isTransitionEndSupported', () => {
    it('returns false when the browser has no TransitionEvent', () => {
      delete window.TransitionEvent;
      expect(isTransitionEndSupported()).toBe(false);
    });

    it('returns true when the browser exposes TransitionEvent', () => {
      Object.defineProperty(window, 'TransitionEvent', {
        configurable: true,
        value: class TransitionEvent {},
      });

      expect(isTransitionEndSupported()).toBe(true);
    });
  });
});
