import React from 'react';
import PropTypes, { checkPropTypes } from 'prop-types';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  and,
  forbidExtraProps,
  integer,
  mutuallyExclusiveProps,
  nonNegativeInteger,
  nonNegativeNumber,
  or,
} from '../../../src/internal/propTypes/index.js';
import dateTimeValidator from '../../../src/internal/date/dateTimePropType.js';
import {
  getDirectionClassName,
  getNoFlipClassName,
} from '../../../src/internal/styles/rtl.js';
import noflip from '../../../src/internal/styles/noflip.js';
import { withStyles, withStylesPropTypes } from '../../../src/internal/styles/withStyles.jsx';
import ModifiersShape from '../../../src/shapes/ModifiersShape.js';

function propWarnings(schema, props, componentName) {
  const warnings = [];
  const spy = vi.spyOn(console, 'error').mockImplementation((message) => warnings.push(message));
  checkPropTypes.resetWarningCache();
  checkPropTypes(schema, props, 'prop', componentName);
  spy.mockRestore();
  return warnings.join(' ');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('internal prop-type contracts', () => {
  it('accepts valid integer and non-negative values, including zero', () => {
    expect(propWarnings({ value: integer }, { value: 4 }, 'IntegerValid')).toBe('');
    expect(propWarnings({ value: nonNegativeInteger }, { value: 0 }, 'NonNegativeIntegerValid')).toBe('');
    expect(propWarnings({ value: nonNegativeNumber }, { value: 0 }, 'NonNegativeNumberValid')).toBe('');
    expect(propWarnings({ value: integer.isRequired }, { value: 2 }, 'IntegerRequiredValid')).toBe('');
  });

  it('reports invalid integer and non-negative number branches', () => {
    expect(propWarnings({ value: integer }, { value: 1.5 }, 'IntegerInvalid')).toContain(
      'value in IntegerInvalid must be an integer',
    );
    expect(propWarnings({ value: nonNegativeInteger }, { value: -1 }, 'NegativeIntegerInvalid')).toContain(
      'value in NegativeIntegerInvalid must be a non-negative number',
    );
    expect(propWarnings({ value: nonNegativeNumber }, { value: Number.NaN }, 'NaNInvalid')).toContain(
      'value in NaNInvalid must be a non-negative number',
    );
    expect(propWarnings({ value: nonNegativeNumber }, { value: -0 }, 'NegativeZeroInvalid')).toContain(
      'value in NegativeZeroInvalid must be a non-negative number',
    );
  });

  it('handles required values and rejects unknown props', () => {
    expect(propWarnings({ value: integer.isRequired }, {}, 'RequiredMissing')).toContain(
      'RequiredMissing: value is required',
    );
    expect(propWarnings(forbidExtraProps({ value: integer }), { value: 1, extra: true }, 'ExtraProp'))
      .toContain('ExtraProp: unknown props found: extra');
    expect(() => forbidExtraProps(null)).toThrow(TypeError);
    expect(() => forbidExtraProps([])).toThrow(TypeError);
  });

  it('composes and/or validators while preserving required behavior', () => {
    const positive = (props, propName) => (props[propName] > 0 ? null : new Error('must be positive'));
    positive.isRequired = positive;
    const both = and([PropTypes.number, positive], 'PositiveNumber');
    const either = or([PropTypes.string, PropTypes.number], 'StringOrNumber');

    expect(propWarnings({ value: both }, { value: 3 }, 'AndValid')).toBe('');
    expect(propWarnings({ value: both }, { value: -1 }, 'AndInvalid')).toContain('must be positive');
    expect(propWarnings({ value: either }, { value: 'ok' }, 'OrStringValid')).toBe('');
    expect(propWarnings({ value: either }, { value: true }, 'OrInvalid')).toContain(
      'OrInvalid: invalid value supplied to value',
    );
    expect(propWarnings({ value: either.isRequired }, {}, 'OrRequiredMissing')).toContain(
      'OrRequiredMissing: value is required',
    );
    expect(() => and([PropTypes.string])).toThrow(TypeError);
    expect(() => or([PropTypes.string])).toThrow(TypeError);
  });

  it('enforces mutually exclusive props and delegates the base validator', () => {
    const exclusive = mutuallyExclusiveProps(PropTypes.string, 'first', 'second');

    expect(propWarnings({ first: exclusive }, { first: 'a', second: null }, 'ExclusiveValid')).toBe('');
    expect(propWarnings({ first: exclusive }, { first: 'a', second: 'b' }, 'ExclusiveInvalid')).toContain(
      'cannot have more than one of these props: first, or second',
    );
    expect(propWarnings({ first: exclusive.isRequired }, {}, 'ExclusiveRequiredMissing')).toContain(
      'The prop `first` is marked as required',
    );
    expect(() => mutuallyExclusiveProps(null, 'other')).toThrow(TypeError);
    expect(() => mutuallyExclusiveProps(PropTypes.string)).toThrow(TypeError);
  });
});

describe('DateTime prop validation', () => {
  it('accepts valid Luxon DateTimes and optional nullish values', () => {
    expect(propWarnings({ date: dateTimeValidator }, { date: DateTime.fromISO('2099-02-03') }, 'DateTimeValid')).toBe('');
    expect(propWarnings({ date: dateTimeValidator }, { date: null }, 'DateTimeNull')).toBe('');
    expect(propWarnings({ date: dateTimeValidator }, {}, 'DateTimeUndefined')).toBe('');
  });

  it('rejects invalid Luxon, native Date, and required values', () => {
    expect(propWarnings({ date: dateTimeValidator }, { date: DateTime.invalid('bad') }, 'DateTimeInvalid')).toContain(
      'date must be a valid Luxon DateTime',
    );
    expect(propWarnings({ date: dateTimeValidator }, { date: new Date() }, 'DateNativeInvalid')).toContain(
      'date must be a valid Luxon DateTime',
    );
    expect(propWarnings({ date: dateTimeValidator.isRequired }, {}, 'DateTimeRequired')).toContain(
      'DateTimeRequired: date is required',
    );
  });
});

describe('RTL and no-flip styling contracts', () => {
  it('adds direction-aware class names only when requested', () => {
    expect(getDirectionClassName('CalendarDay', true)).toBe('CalendarDay CalendarDay__rtl');
    expect(getDirectionClassName('CalendarDay', false)).toBe('CalendarDay');
    expect(getNoFlipClassName('CalendarDay', true)).toBe('CalendarDay CalendarDay__noflip');
    expect(getNoFlipClassName('CalendarDay', false)).toBe('CalendarDay');
  });

  it('marks string and numeric values as no-flip and rejects unsupported values', () => {
    expect(noflip('left: 0')).toBe('left: 0 /* @noflip */');
    expect(noflip(12)).toBe('12px /* @noflip */');
    expect(() => noflip({})).toThrow(TypeError);
  });
});

describe('withStyles observable edge cases', () => {
  it('injects static class names, merges inline styles, and forwards ordinary props', () => {
    function Button({ css, styles, title }) {
      return (
        <button type="button" title={title} {...css(
          styles.Button,
          'extra-class',
          { color: 'red', style: { padding: 4 } },
          [styles.Button, { margin: 2 }],
        )}>
          button
        </button>
      );
    }
    const Styled = withStyles(() => ({ Button: { color: 'blue' } }))(Button);
    render(<Styled title="passed-through" />);
    const button = screen.getByRole('button', { name: 'button' });

    expect(button.title).toBe('passed-through');
    expect(button.className).toBe('Button extra-class Button');
    expect(button.style.color).toBe('red');
    expect(button.style.padding).toBe('4px');
    expect(button.style.margin).toBe('2px');
  });

  it('supports custom prop names, custom themes, and absent style factories', () => {
    function Label({ design, palette, applyCss }) {
      return <span {...applyCss(design.Label)}>{palette.name}</span>;
    }
    const Styled = withStyles(
      (theme) => ({ Label: { color: theme.name } }),
      { stylesPropName: 'design', themePropName: 'palette', cssPropName: 'applyCss' },
    )(Label);
    const { rerender } = render(<Styled palette={{ name: 'custom' }} />);
    expect(screen.getByText('custom').className).toBe('Label');

    function Plain({ css }) {
      return <span {...css({ color: 'green' })}>plain</span>;
    }
    const NoStyles = withStyles(() => null)(Plain);
    rerender(<NoStyles />);
    expect(screen.getByText('plain').style.color).toBe('green');
  });

  it('exposes non-required injected prop types and normalizes wrapped defaults', () => {
    class Defaulted extends React.Component {
      static defaultProps = { label: 'default label' };

      render() {
        const { css, label, styles } = this.props;
        return <span {...css(styles.Label)}>{label}</span>;
      }
    }
    Defaulted.propTypes = {
      label: PropTypes.string,
      styles: PropTypes.object.isRequired,
      theme: PropTypes.object.isRequired,
      css: PropTypes.func.isRequired,
    };
    const Styled = withStyles(() => ({ Label: {} }))(Defaulted);
    expect(Styled.propTypes.styles).toBeUndefined();
    expect(Styled.propTypes.theme).toBeUndefined();
    expect(Styled.propTypes.css).toBeUndefined();
    render(<Styled />);
    expect(screen.getByText('default label').className).toBe('Label');
    expect(withStylesPropTypes).toEqual({
      styles: expect.any(Function),
      theme: expect.any(Function),
      css: expect.any(Function),
    });
  });
});

describe('ModifiersShape', () => {
  it('accepts empty and string-valued Sets', () => {
    expect(propWarnings({ modifiers: ModifiersShape }, { modifiers: new Set() }, 'ModifiersEmpty')).toBe('');
    expect(propWarnings(
      { modifiers: ModifiersShape },
      { modifiers: new Set(['selected', 'blocked']) },
      'ModifiersValid',
    )).toBe('');
  });

  it('rejects non-Sets and identifies the first non-string entry', () => {
    expect(propWarnings({ modifiers: ModifiersShape }, { modifiers: ['selected'] }, 'ModifiersArray')).toContain(
      'expected instance of `Set`',
    );
    expect(propWarnings(
      { modifiers: ModifiersShape },
      { modifiers: new Set(['selected', 3, 'blocked']) },
      'ModifiersBadEntry',
    )).toContain('modifiers: index 1');
    expect(propWarnings({ modifiers: ModifiersShape.isRequired }, {}, 'ModifiersRequired')).toContain(
      'The prop `modifiers` is marked as required',
    );
  });
});
