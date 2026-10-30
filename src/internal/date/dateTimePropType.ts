import type { DateTime } from 'luxon';

import isDateTime from '../../utils/isDateTime.js';

type ValidatorProps = Record<string, unknown> | null | undefined;

export type DateTimeValidation = (
  props: ValidatorProps,
  propName: string,
  componentName?: string,
  ...rest: unknown[]
) => TypeError | null;

export interface DateTimeValidator extends DateTimeValidation {
  isRequired: DateTimeValidation;
}

function validateDateTime(
  props: ValidatorProps,
  propName: string,
  componentName?: string,
) {
  const value = props?.[propName];
  if (isDateTime(value)) return null;
  return new TypeError(`${componentName || 'Component'}: ${propName} must be a valid Luxon DateTime.`);
}

function makeValidator(required: boolean): DateTimeValidator {
  const validator = (
    props: ValidatorProps,
    propName: string,
    componentName?: string,
  ) => {
    const value = props?.[propName] as DateTime | null | undefined;
    if (value == null) {
      return required
        ? new TypeError(`${componentName || 'Component'}: ${propName} is required.`)
        : null;
    }
    return validateDateTime(props, propName, componentName);
  };
  validator.isRequired = (
    props: ValidatorProps,
    propName: string,
    componentName?: string,
  ) => {
    const value = props?.[propName] as DateTime | null | undefined;
    if (value == null) {
      return new TypeError(`${componentName || 'Component'}: ${propName} is required.`);
    }
    return validateDateTime(props, propName, componentName);
  };
  return validator;
}

export const dateTime = makeValidator(false);
export const dateTimePropType = dateTime;

export default dateTime;
