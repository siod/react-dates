import React from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { forbidExtraProps, nonNegativeInteger } from '../internal/propTypes';
import { dateTime, formatDate, parseLocalizedDate } from '../internal/date';
import openDirectionShape from '../shapes/OpenDirectionShape';

import { SingleDatePickerInputPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import SingleDatePickerInput from './SingleDatePickerInput';

import IconPositionShape from '../shapes/IconPositionShape';
import DisabledShape from '../shapes/DisabledShape';

import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay';

import {
  ICON_BEFORE_POSITION,
  OPEN_DOWN,
} from '../constants';

const propTypes = forbidExtraProps({
  children: PropTypes.node,

  date: dateTime,
  onDateChange: PropTypes.func.isRequired,

  focused: PropTypes.bool,
  onFocusChange: PropTypes.func.isRequired,

  id: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  autoComplete: PropTypes.string,
  titleText: PropTypes.string,
  screenReaderMessage: PropTypes.string,
  showClearDate: PropTypes.bool,
  showCaret: PropTypes.bool,
  showDefaultInputIcon: PropTypes.bool,
  inputIconPosition: IconPositionShape,
  disabled: DisabledShape,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  openDirection: openDirectionShape,
  noBorder: PropTypes.bool,
  block: PropTypes.bool,
  small: PropTypes.bool,
  regular: PropTypes.bool,
  verticalSpacing: nonNegativeInteger,

  keepOpenOnDateSelect: PropTypes.bool,
  reopenPickerOnClearDate: PropTypes.bool,
  isOutsideRange: PropTypes.func,
  isDayBlocked: PropTypes.func,
  displayFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),

  onClose: PropTypes.func,
  onKeyDownArrowDown: PropTypes.func,
  onKeyDownQuestionMark: PropTypes.func,

  customInputIcon: PropTypes.node,
  customCloseIcon: PropTypes.node,

  // accessibility
  isFocused: PropTypes.bool,

  // i18n
  phrases: PropTypes.shape(getPhrasePropTypes(SingleDatePickerInputPhrases)),

  isRTL: PropTypes.bool,
});

const defaultProps = {
  children: null,

  date: null,
  focused: false,

  placeholder: '',
  ariaLabel: undefined,
  autoComplete: 'off',
  titleText: undefined,
  screenReaderMessage: 'Date',
  showClearDate: false,
  showCaret: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  disabled: false,
  required: false,
  readOnly: false,
  openDirection: OPEN_DOWN,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  verticalSpacing: undefined,

  keepOpenOnDateSelect: false,
  reopenPickerOnClearDate: false,
  isOutsideRange: (day) => !isInclusivelyAfterDay(day, DateTime.local()),
  isDayBlocked: () => false,
  displayFormat: { dateStyle: 'short' },

  onClose() {},
  onKeyDownArrowDown() {},
  onKeyDownQuestionMark() {},

  customInputIcon: null,
  customCloseIcon: null,

  // accessibility
  isFocused: false,

  // i18n
  phrases: SingleDatePickerInputPhrases,

  isRTL: false,
};

export default class SingleDatePickerInputController extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onClearFocus = this.onClearFocus.bind(this);
    this.clearDate = this.clearDate.bind(this);
  }

  onChange(dateString) {
    const {
      isOutsideRange,
      isDayBlocked,
      keepOpenOnDateSelect,
      onDateChange,
      onFocusChange,
      onClose,
    } = this.props;
    const newDate = this.parseDate(dateString);

    const isValid = newDate && !isOutsideRange(newDate) && !isDayBlocked(newDate);
    if (isValid) {
      onDateChange(newDate);
      if (!keepOpenOnDateSelect) {
        onFocusChange({ focused: false });
        onClose({ date: newDate });
      }
    } else {
      onDateChange(null);
    }
  }

  onFocus() {
    const {
      onFocusChange,
      disabled,
    } = this.props;

    if (!disabled) {
      onFocusChange({ focused: true });
    }
  }

  onClearFocus() {
    const {
      focused,
      onFocusChange,
      onClose,
      date,
    } = this.props;
    if (!focused) return;

    onFocusChange({ focused: false });
    onClose({ date });
  }

  parseDate(value) {
    const { displayFormat } = this.props;
    return parseLocalizedDate(value, {
      ...(typeof displayFormat === 'function' ? { dateStyle: 'short' } : displayFormat),
    });
  }

  getDateString(date) {
    if (!date) return '';
    const { displayFormat } = this.props;
    const value = typeof displayFormat === 'function' ? displayFormat(date) : null;
    if (typeof value === 'string') return value;
    return formatDate(date, {
      ...(value || displayFormat || { dateStyle: 'short' }),
    });
  }

  clearDate() {
    const { onDateChange, reopenPickerOnClearDate, onFocusChange } = this.props;
    onDateChange(null);
    if (reopenPickerOnClearDate) {
      onFocusChange({ focused: true });
    }
  }

  render() {
    const {
      children,
      id,
      placeholder,
      ariaLabel,
      autoComplete,
      titleText,
      disabled,
      focused,
      isFocused,
      required,
      readOnly,
      openDirection,
      showClearDate,
      showCaret,
      showDefaultInputIcon,
      inputIconPosition,
      customCloseIcon,
      customInputIcon,
      date,
      phrases,
      onKeyDownArrowDown,
      onKeyDownQuestionMark,
      screenReaderMessage,
      isRTL,
      noBorder,
      block,
      small,
      regular,
      verticalSpacing,
    } = this.props;

    const displayValue = this.getDateString(date);

    return (
      <SingleDatePickerInput
        id={id}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        autoComplete={autoComplete}
        titleText={titleText}
        focused={focused}
        isFocused={isFocused}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        openDirection={openDirection}
        showCaret={showCaret}
        onClearDate={this.clearDate}
        showClearDate={showClearDate}
        showDefaultInputIcon={showDefaultInputIcon}
        inputIconPosition={inputIconPosition}
        customCloseIcon={customCloseIcon}
        customInputIcon={customInputIcon}
        displayValue={displayValue}
        onChange={this.onChange}
        onFocus={this.onFocus}
        onKeyDownShiftTab={this.onClearFocus}
        onKeyDownArrowDown={onKeyDownArrowDown}
        onKeyDownQuestionMark={onKeyDownQuestionMark}
        screenReaderMessage={screenReaderMessage}
        phrases={phrases}
        isRTL={isRTL}
        noBorder={noBorder}
        block={block}
        small={small}
        regular={regular}
        verticalSpacing={verticalSpacing}
      >
        {children}
      </SingleDatePickerInput>
    );
  }
}

SingleDatePickerInputController.propTypes = propTypes;
SingleDatePickerInputController.defaultProps = defaultProps;
