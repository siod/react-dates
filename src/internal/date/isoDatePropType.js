import { isCanonicalDate } from './dateAdapter';

function validateCanonicalDate(props, propName, componentName) {
  const value = props[propName];
  if (typeof value === 'string' && isCanonicalDate(value)) return null;
  return new TypeError(`${componentName || 'Component'}: ${propName} must be a canonical YYYY-MM-DD date.`);
}

function makeValidator(required) {
  const validator = (props, propName, componentName, ...rest) => {
    const value = props && props[propName];
    if (value == null) {
      return required
        ? new TypeError(`${componentName || 'Component'}: ${propName} is required.`)
        : null;
    }
    return validateCanonicalDate(props, propName, componentName, ...rest);
  };
  validator.isRequired = makeRequiredValidator(validator);
  return validator;
}

function makeRequiredValidator(validator) {
  return (props, propName, componentName, ...rest) => {
    const value = props && props[propName];
    if (value == null) return new TypeError(`${componentName || 'Component'}: ${propName} is required.`);
    return validateCanonicalDate(props, propName, componentName, ...rest);
  };
}

export const isoDate = makeValidator(false);
export const canonicalDate = isoDate;
export const isoDatePropType = isoDate;

export default isoDate;
