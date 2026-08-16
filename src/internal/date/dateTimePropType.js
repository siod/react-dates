import isDateTime from '../../utils/isDateTime';

function validateDateTime(props, propName, componentName) {
  const value = props[propName];
  if (isDateTime(value)) return null;
  return new TypeError(`${componentName || 'Component'}: ${propName} must be a valid Luxon DateTime.`);
}

function makeValidator(required) {
  const validator = (props, propName, componentName, ...rest) => {
    const value = props && props[propName];
    if (value == null) {
      return required
        ? new TypeError(`${componentName || 'Component'}: ${propName} is required.`)
        : null;
    }
    return validateDateTime(props, propName, componentName, ...rest);
  };
  validator.isRequired = (props, propName, componentName, ...rest) => {
    const value = props && props[propName];
    if (value == null) {
      return new TypeError(`${componentName || 'Component'}: ${propName} is required.`);
    }
    return validateDateTime(props, propName, componentName, ...rest);
  };
  return validator;
}

export const dateTime = makeValidator(false);
export const dateTimePropType = dateTime;

export default dateTime;
