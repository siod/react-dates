import PropTypes, { checkPropTypes } from 'prop-types';
import { describe, expect, it, vi } from 'vitest';

import {
  and,
  forbidExtraProps,
  mutuallyExclusiveProps,
  nonNegativeInteger,
  or,
} from '../../src/internal/propTypes';

describe('local prop type equivalents', () => {
  it('forbids unknown props and validates non-negative integers', () => {
    const errors = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((message) => errors.push(message));
    checkPropTypes(forbidExtraProps({ count: nonNegativeInteger }), { count: 1, extra: true }, 'prop', 'Widget');
    expect(errors.join(' ')).toContain('unknown props found: extra');
    spy.mockRestore();
  });

  it('supports composition, unions and mutual exclusion', () => {
    const positive = (props, name) => props[name] > 0 ? null : new Error('positive');
    positive.isRequired = positive;
    const errors = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((message) => errors.push(message));
    checkPropTypes({ value: and([PropTypes.number, positive]) }, { value: 2 }, 'prop', 'Widget');
    checkPropTypes({ value: or([PropTypes.string, PropTypes.number]) }, { value: 2 }, 'prop', 'Widget');
    expect(errors).toHaveLength(0);
    spy.mockRestore();
    const exclusive = mutuallyExclusiveProps(PropTypes.bool, 'a', 'b');
    const mutualErrors = [];
    const mutualSpy = vi.spyOn(console, 'error').mockImplementation((message) => mutualErrors.push(message));
    checkPropTypes({ a: exclusive }, { a: true, b: true }, 'prop', 'Widget');
    expect(mutualErrors.join(' ')).toContain('more than one');
    mutualSpy.mockRestore();
  });
});
