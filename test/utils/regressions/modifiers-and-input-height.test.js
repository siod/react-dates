import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import { VERTICAL_SCROLLABLE } from '../../../src/constants.js';
import getInputHeight from '../../../src/utils/getInputHeight.js';
import { addModifier, deleteModifier } from '../../../src/utils/modifiers.js';

const month = DateTime.fromISO('2024-02-01', { zone: 'UTC' }).setLocale('en-US');
const date = (value) => DateTime.fromISO(value, { zone: 'UTC' }).setLocale('en-US');

function state(visibleDays = {
  '2024-02': {
    '2024-02-14': new Set(),
  },
}) {
  return { currentMonth: month, visibleDays };
}

function props(overrides = {}) {
  return {
    enableOutsideDays: false,
    numberOfMonths: 1,
    orientation: 'horizontal',
    ...overrides,
  };
}

describe('utility coverage contracts', () => {
  describe('addModifier and deleteModifier', () => {
    it('adds a modifier to the visible month without mutating source sets', () => {
      const original = new Set(['selected']);
      const visibleDays = { '2024-02': { '2024-02-14': original } };
      const updated = addModifier({}, date('2024-02-14'), 'blocked', props(), state(visibleDays));

      expect(updated['2024-02']['2024-02-14']).toEqual(new Set(['selected', 'blocked']));
      expect(original).toEqual(new Set(['selected']));
      expect(visibleDays['2024-02']['2024-02-14']).toBe(original);
    });

    it('does not duplicate an existing modifier or rewrite an absent target', () => {
      const existing = new Set(['selected', 'blocked']);
      const visibleDays = { '2024-02': { '2024-02-14': existing } };
      const updated = addModifier({}, date('2024-02-14'), 'blocked', props(), state(visibleDays));
      const unchanged = addModifier({}, date('2024-12-01'), 'blocked', props(), state(visibleDays));

      expect(updated).toEqual({});
      expect(unchanged).toEqual({});
    });

    it('deletes only the requested modifier and preserves remaining modifiers', () => {
      const visibleDays = {
        '2024-02': {
          '2024-02-14': new Set(['selected', 'blocked']),
        },
      };
      const updated = deleteModifier(
        {},
        date('2024-02-14'),
        'blocked',
        props(),
        state(visibleDays),
      );
      const absent = deleteModifier({}, date('2024-02-14'), 'hovered', props(), state(visibleDays));

      expect(updated['2024-02']['2024-02-14']).toEqual(new Set(['selected']));
      expect(absent).toEqual({});
    });

    it('returns the supplied object for missing, invalid, and out-of-window days', () => {
      const supplied = { '2024-02': { '2024-02-14': new Set(['selected']) } };
      const currentState = state();
      expect(addModifier(supplied, null, 'blocked', props(), currentState)).toBe(supplied);
      expect(deleteModifier(supplied, DateTime.invalid('bad'), 'selected', props(), currentState))
        .toBe(supplied);
      expect(addModifier(supplied, date('2024-12-01'), 'blocked', props(), currentState))
        .toBe(supplied);
      expect(deleteModifier(supplied, date('2024-12-01'), 'selected', props(), currentState))
        .toBe(supplied);
    });

    it('handles an empty visible-day map by creating the visible target month', () => {
      const empty = state({});
      expect(addModifier({}, date('2024-02-14'), 'selected', props(), empty))
        .toEqual({ '2024-02': { '2024-02-14': new Set(['selected']) } });
      expect(deleteModifier({}, date('2024-02-14'), 'selected', props(), empty)).toEqual({});
    });

    it('updates every duplicate outside-day occurrence when padding is enabled', () => {
      const outsideDay = date('2024-01-31');
      const visibleDays = {
        '2024-01': { '2024-01-31': new Set(['outside']) },
        '2024-02': { '2024-01-31': new Set() },
      };
      const withModifier = addModifier(
        {},
        outsideDay,
        'blocked',
        props({ enableOutsideDays: true }),
        state(visibleDays),
      );
      const withoutModifier = deleteModifier(
        withModifier,
        outsideDay,
        'outside',
        props({ enableOutsideDays: true }),
        state(visibleDays),
      );

      expect(withModifier['2024-01']['2024-01-31']).toEqual(new Set(['outside', 'blocked']));
      expect(withModifier['2024-02']['2024-01-31']).toEqual(new Set(['blocked']));
      expect(withoutModifier['2024-01']['2024-01-31']).toEqual(new Set(['blocked']));
      expect(withoutModifier['2024-02']['2024-01-31']).toEqual(new Set(['blocked']));
    });

    it('uses all loaded months for vertical-scrollable modifier updates', () => {
      const visibleDays = {
        '2024-02': { '2024-02-14': new Set() },
        '2024-03': { '2024-03-14': new Set() },
        '2024-04': { '2024-04-14': new Set() },
      };
      const scrollableProps = props({ orientation: VERTICAL_SCROLLABLE });
      const scrollableState = state(visibleDays);
      const updated = addModifier(
        {},
        date('2024-04-14'),
        'highlighted',
        scrollableProps,
        scrollableState,
      );

      expect(updated['2024-04']['2024-04-14']).toEqual(new Set(['highlighted']));
      expect(updated['2024-02']).toBeUndefined();
    });

    it('prefers explicitly accumulated updates over the visible-day fallback', () => {
      const supplied = {
        '2024-02': { '2024-02-14': new Set(['selected']) },
      };
      const visibleDays = {
        '2024-02': { '2024-02-14': new Set(['old']) },
      };
      const updated = addModifier(
        supplied,
        date('2024-02-14'),
        'blocked',
        props(),
        state(visibleDays),
      );

      expect(updated['2024-02']['2024-02-14']).toEqual(new Set(['selected', 'blocked']));
      expect(updated['2024-02']['2024-02-14']).not.toContain('old');
    });
  });

  describe('getInputHeight', () => {
    const theme = (spacing, smallSpacing = spacing) => ({
      font: {
        input: {
          lineHeight: '24px',
          lineHeight_small: '16px',
        },
      },
      spacing: {
        inputPadding: 5,
        ...spacing,
        displayTextPaddingVertical_small: smallSpacing.displayTextPaddingVertical,
        displayTextPaddingTop_small: smallSpacing.displayTextPaddingTop,
        displayTextPaddingBottom_small: smallSpacing.displayTextPaddingBottom,
      },
    });

    it.each([
      [{ displayTextPaddingTop: 3, displayTextPaddingBottom: 4 }, 41],
      [{ displayTextPaddingTop: 3, displayTextPaddingVertical: 6 }, 43],
      [{ displayTextPaddingTop: 3 }, 37],
      [{ displayTextPaddingBottom: 4, displayTextPaddingVertical: 6 }, 44],
      [{ displayTextPaddingBottom: 4 }, 38],
      [{ displayTextPaddingVertical: 6 }, 46],
      [{}, 34],
    ])('uses the regular top/bottom/vertical padding fallback (%j)', (spacing, expected) => {
      expect(getInputHeight(theme(spacing))).toBe(expected);
    });

    it('uses the small line height and small padding fallback independently', () => {
      const regular = {
        displayTextPaddingTop: 3,
        displayTextPaddingBottom: 4,
      };
      const small = {
        displayTextPaddingTop: 2,
        displayTextPaddingBottom: 3,
      };
      expect(getInputHeight(theme(regular, small), true)).toBe(31);
    });

    it('accepts numeric line heights and ignores non-numeric optional padding values', () => {
      const value = getInputHeight({
        font: { input: { lineHeight: 20, lineHeight_small: 14 } },
        spacing: {
          inputPadding: 4,
          displayTextPaddingVertical: '6px',
          displayTextPaddingTop: undefined,
          displayTextPaddingBottom: undefined,
        },
      });

      expect(value).toBe(28);
    });
  });
});
