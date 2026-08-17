import { afterEach, describe, expect, it, vi } from 'vitest';

import calculateDimension from '../../src/utils/calculateDimension';
import getCalendarMonthWidth from '../../src/utils/getCalendarMonthWidth';
import getDetachedContainerStyles from '../../src/utils/getDetachedContainerStyles';
import getInputHeight from '../../src/utils/getInputHeight';
import getPhrase from '../../src/utils/getPhrase.jsx';
import getPhrasePropTypes from '../../src/utils/getPhrasePropTypes';
import getResponsiveContainerStyles from '../../src/utils/getResponsiveContainerStyles';
import getTransformStyles from '../../src/utils/getTransformStyles';
import noflip from '../../src/utils/noflip';
import {
  ANCHOR_LEFT,
  ANCHOR_RIGHT,
  OPEN_DOWN,
  OPEN_UP,
} from '../../src/constants';

const theme = {
  font: {
    input: {
      lineHeight: 13,
      lineHeight_small: 7,
    },
  },
  spacing: {
    inputPadding: 10,
    displayTextPaddingVertical: 8,
    displayTextPaddingTop: 10,
    displayTextPaddingBottom: 12,
    displayTextPaddingVertical_small: 2,
    displayTextPaddingTop_small: 4,
    displayTextPaddingBottom_small: 6,
  },
};

const originalClientWidth = Object.getOwnPropertyDescriptor(
  document.documentElement,
  'clientWidth',
);

afterEach(() => {
  if (originalClientWidth) {
    Object.defineProperty(document.documentElement, 'clientWidth', originalClientWidth);
  } else {
    delete document.documentElement.clientWidth;
  }
});

describe('layout and presentation utilities', () => {
  describe('calculateDimension', () => {
    it('returns zero for an empty element and offset dimensions for border boxes', () => {
      expect(calculateDimension(null, 'width')).toBe(0);
      expect(calculateDimension(null, 'height', true)).toBe(0);

      const element = { offsetWidth: 17, offsetHeight: 42 };
      expect(calculateDimension(element, 'width', true)).toBe(17);
      expect(calculateDimension(element, 'height', true)).toBe(42);
    });

    it('calculates content-box and margin-inclusive dimensions deterministically', () => {
      const element = { offsetWidth: 122, offsetHeight: 282 };
      const style = {
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '15px',
        paddingBottom: '15px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
        marginLeft: '2px',
        marginRight: '6px',
        marginTop: '3px',
        marginBottom: '5px',
      };
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(style);

      expect(calculateDimension(element, 'width')).toBe(100);
      expect(calculateDimension(element, 'width', false, true)).toBe(108);
      expect(calculateDimension(element, 'height')).toBe(250);
      expect(calculateDimension(element, 'height', false, true)).toBe(258);
      expect(calculateDimension(element, 'width', true, true)).toBe(130);
    });
  });

  it('calculates calendar month width with default and explicit padding', () => {
    expect(getCalendarMonthWidth(39, 13)).toBe(300);
    expect(getCalendarMonthWidth(39)).toBe(274);
    expect(Number.isNaN(getCalendarMonthWidth(39, null))).toBe(false);
  });

  describe('getDetachedContainerStyles', () => {
    it('positions all four open/anchor combinations from a reference rect', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(100);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(100);
      const reference = {
        getBoundingClientRect: () => ({ top: 10, bottom: 40, left: 10, right: 110 }),
      };

      expect(getDetachedContainerStyles(OPEN_DOWN, ANCHOR_LEFT, reference).transform)
        .toBe('translate3d(10px, 10px, 0)');
      expect(getDetachedContainerStyles(OPEN_UP, ANCHOR_LEFT, reference).transform)
        .toBe('translate3d(10px, -60px, 0)');
      expect(getDetachedContainerStyles(OPEN_DOWN, ANCHOR_RIGHT, reference).transform)
        .toBe('translate3d(10px, 10px, 0)');
      expect(getDetachedContainerStyles(OPEN_UP, ANCHOR_RIGHT, reference).transform)
        .toBe('translate3d(10px, -60px, 0)');
    });
  });

  describe('getInputHeight', () => {
    it('uses the regular and small theme spacing values', () => {
      expect(getInputHeight(theme)).toBe(55);
      expect(getInputHeight(theme, true)).toBe(37);
    });
  });

  describe('getResponsiveContainerStyles', () => {
    it('uses the document viewport and returns an anchored numeric offset', () => {
      Object.defineProperty(document.documentElement, 'clientWidth', {
        configurable: true,
        value: 100,
      });

      expect(getResponsiveContainerStyles(ANCHOR_LEFT, 0, {
        left: 10,
        width: 80,
        right: 90,
      })).toEqual({ left: 0 });
      expect(getResponsiveContainerStyles(ANCHOR_RIGHT, 0, {
        left: 10,
        width: 80,
        right: 90,
      })).toEqual({ right: 0 });
    });

    it('constrains an oversized container and honors the viewport margin', () => {
      Object.defineProperty(document.documentElement, 'clientWidth', {
        configurable: true,
        value: 100,
      });

      expect(getResponsiveContainerStyles(ANCHOR_LEFT, 0, {
        left: 0,
        width: 120,
        right: 120,
      }, 10)).toEqual({ left: 10, maxWidth: 80, overflowX: 'auto' });
    });
  });

  it('returns all transform vendor keys for one value', () => {
    expect(getTransformStyles('translateX(1px)')).toEqual({
      transform: 'translateX(1px)',
      msTransform: 'translateX(1px)',
      MozTransform: 'translateX(1px)',
      WebkitTransform: 'translateX(1px)',
    });
  });

  describe('noflip', () => {
    it('formats numeric and string values and rejects other types', () => {
      expect(noflip(42)).toBe('42px /* @noflip */');
      expect(noflip('foo')).toBe('foo /* @noflip */');
      expect(() => noflip([])).toThrow(TypeError);
    });
  });

  describe('phrase helpers', () => {
    it('returns strings, invokes phrase functions with their argument, and falls back to empty text', () => {
      const phrase = vi.fn(() => 'computed phrase');
      const args = { date: '2024-02-03' };

      expect(getPhrase('plain phrase')).toBe('plain phrase');
      expect(getPhrase(phrase, args)).toBe('computed phrase');
      expect(phrase).toHaveBeenCalledWith(args);
      expect(getPhrase()).toBe('');
    });

    it('creates a prop type entry for every default phrase key', () => {
      const propTypes = getPhrasePropTypes({ first: 'First', second: 'Second' });

      expect(Object.keys(propTypes)).toEqual(['first', 'second']);
    });
  });
});
