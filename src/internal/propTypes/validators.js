/* eslint-disable react/display-name */
import PropTypes from 'prop-types';

const EXACT_KEY = 'prop-types-exact: \u200b';

function withRequired(validator, required) {
  const wrapped = (props, propName, componentName, ...rest) => {
    if (!required && props[propName] == null) return null;
    return validator(props, propName, componentName, ...rest);
  };
  wrapped.isRequired = (props, propName, componentName, ...rest) => {
    if (props[propName] == null) {
      return new TypeError(`${componentName}: ${propName} is required.`);
    }
    return validator(props, propName, componentName, ...rest);
  };
  return wrapped;
}

/** Reject properties that are not part of a component's declared contract. */
export function forbidExtraProps(propTypes) {
  if (!propTypes || Object.getPrototypeOf(propTypes) !== Object.prototype) {
    throw new TypeError('given propTypes must be an object');
  }
  const result = { ...propTypes };
  result[EXACT_KEY] = (props, _, componentName) => {
    const unknown = Reflect.ownKeys(props || {}).filter((key) => (
      Object.prototype.propertyIsEnumerable.call(props, key)
      && !Object.prototype.hasOwnProperty.call(propTypes, key)
    ));
    return unknown.length > 0
      ? new TypeError(`${componentName}: unknown props found: ${unknown.join(', ')}`)
      : null;
  };
  return result;
}

function validateInteger(props, propName, componentName) {
  const value = props[propName];
  if (Number.isInteger(value)) return null;
  return new RangeError(`${propName} in ${componentName} must be an integer`);
}

export const integer = withRequired(validateInteger, false);

function validateNonNegativeNumber(props, propName, componentName) {
  const value = props[propName];
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && !Object.is(value, -0)) return null;
  return new RangeError(`${propName} in ${componentName} must be a non-negative number`);
}

export const nonNegativeNumber = withRequired(validateNonNegativeNumber, false);

function createNonNegativeInteger() {
  const validator = (props, propName, componentName, ...rest) => (
    integer(props, propName, componentName, ...rest)
    || nonNegativeNumber(props, propName, componentName, ...rest)
  );
  validator.isRequired = (props, propName, componentName, ...rest) => {
    if (props[propName] == null) return new TypeError(`${componentName}: ${propName} is required.`);
    return validator(props, propName, componentName, ...rest);
  };
  return validator;
}

export const nonNegativeInteger = createNonNegativeInteger();

/** Combine validators; the first error is returned, matching `and`. */
export function and(validators, name = 'and') {
  if (!Array.isArray(validators) || validators.length < 2) {
    throw new TypeError(`${name}: 2 or more validators are required`);
  }
  const validator = (props, propName, componentName, ...rest) => {
    for (const check of validators) {
      const error = check(props, propName, componentName, ...rest);
      if (error) return error;
    }
    return null;
  };
  validator.isRequired = (props, propName, componentName, ...rest) => {
    for (const check of validators) {
      const error = (check.isRequired || check)(props, propName, componentName, ...rest);
      if (error) return error;
    }
    return null;
  };
  validator.typeName = name;
  return validator;
}

/** Combine validators with an `or` union (and support arrays of alternatives). */
export function or(validators, name = 'or') {
  if (!Array.isArray(validators) || validators.length < 2) {
    throw new TypeError(`${name}: 2 or more validators are required`);
  }
  const one = (props, propName, componentName, ...rest) => {
    if (typeof props[propName] === 'undefined') return null;
    const errors = validators.map((check) => check(props, propName, componentName, ...rest));
    return errors.some((error) => !error) ? null : new TypeError(`${componentName}: invalid value supplied to ${propName}.`);
  };
  one.isRequired = (props, propName, componentName, ...rest) => {
    if (props[propName] == null) return new TypeError(`${componentName}: ${propName} is required.`);
    return one(props, propName, componentName, ...rest);
  };
  one.typeName = name;
  return one;
}

export function mutuallyExclusiveProps(propType, ...exclusiveProps) {
  if (typeof propType !== 'function') throw new TypeError('a propType is required');
  if (exclusiveProps.length < 1) throw new TypeError('at least one prop that is mutually exclusive with this propType is required');
  const names = new Set(exclusiveProps);
  const message = exclusiveProps.join(', or ');
  const check = (props, propName, componentName, ...rest) => {
    const count = Object.keys(props).filter((key) => names.has(key) && props[key] != null).length;
    return count > 1
      ? new Error(`A ${componentName} cannot have more than one of these props: ${message}`)
      : propType(props, propName, componentName, ...rest);
  };
  check.isRequired = (props, propName, componentName, ...rest) => {
    const count = Object.keys(props).filter((key) => names.has(key) && (key === propName || props[key] != null)).length;
    return count > 1
      ? new Error(`A ${componentName} cannot have more than one of these props: ${message}`)
      : (propType.isRequired || propType)(props, propName, componentName, ...rest);
  };
  return check;
}

// Useful for local consumers that need the same primitive validators.
export { PropTypes };
