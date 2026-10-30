import React from 'react';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import noop from '../utils/noop.js';
import { formatDate, parseLocalizedDate } from '../internal/date/index.js';
import type {
  DateFormat,
  DatePredicate,
  IconPosition,
  OpenDirection,
  SingleDatePickerInputPhrases as SingleDatePickerInputPhrasesType,
} from '../types.js';

import { SingleDatePickerInputPhrases } from '../defaultPhrases.js';

import SingleDatePickerInput from './SingleDatePickerInput.js';

import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay.js';

import {
  ICON_BEFORE_POSITION,
  OPEN_DOWN,
} from '../constants.js';

export interface SingleDatePickerInputControllerProps {
  children?: ReactNode;
  date?: DateTime | null;
  onDateChange: (date: DateTime | null) => void;
  focused?: boolean;
  onFocusChange: (arguments_: { focused: boolean }) => void;
  id: string;
  placeholder?: string;
  ariaLabel?: string;
  autoComplete?: string;
  titleText?: string;
  screenReaderMessage?: string;
  showClearDate?: boolean;
  showCaret?: boolean;
  showDefaultInputIcon?: boolean;
  inputIconPosition?: IconPosition;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  openDirection?: OpenDirection;
  noBorder?: boolean;
  block?: boolean;
  small?: boolean;
  regular?: boolean;
  verticalSpacing?: number;
  keepOpenOnDateSelect?: boolean;
  reopenPickerOnClearDate?: boolean;
  isOutsideRange?: DatePredicate;
  isDayBlocked?: DatePredicate;
  displayFormat?: DateFormat;
  onClose?: (arguments_: { date: DateTime | null }) => void;
  onKeyDownArrowDown?: () => void;
  onKeyDownQuestionMark?: () => void;
  customInputIcon?: ReactNode;
  customCloseIcon?: ReactNode;
  isFocused?: boolean;
  phrases?: SingleDatePickerInputPhrasesType;
  isRTL?: boolean;
}

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

  onClose: noop,
  onKeyDownArrowDown: noop,
  onKeyDownQuestionMark: noop,

  customInputIcon: null,
  customCloseIcon: null,

  // accessibility
  isFocused: false,

  // i18n
  phrases: SingleDatePickerInputPhrases,

  isRTL: false,
} satisfies Omit<
SingleDatePickerInputControllerProps,
'id' | 'onDateChange' | 'onFocusChange'
>;

export default class SingleDatePickerInputController extends React.PureComponent<
SingleDatePickerInputControllerProps
> {
  static defaultProps = defaultProps;

  onChange = (dateString: string) => {
    const {
      isOutsideRange = defaultProps.isOutsideRange,
      isDayBlocked = defaultProps.isDayBlocked,
      keepOpenOnDateSelect = defaultProps.keepOpenOnDateSelect,
      onDateChange,
      onFocusChange,
      onClose = defaultProps.onClose,
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
  };

  onFocus = () => {
    const {
      onFocusChange,
      disabled,
    } = this.props;

    if (!disabled) {
      onFocusChange({ focused: true });
    }
  };

  onClearFocus = () => {
    const {
      focused = defaultProps.focused,
      onFocusChange,
      onClose = defaultProps.onClose,
      date = defaultProps.date,
    } = this.props;
    if (!focused) return;

    onFocusChange({ focused: false });
    onClose({ date });
  };

  parseDate(value: string) {
    const displayFormat = this.props.displayFormat ?? defaultProps.displayFormat;
    return parseLocalizedDate(value, {
      ...(typeof displayFormat === 'function' ? { dateStyle: 'short' } : displayFormat),
    });
  }

  getDateString(date: DateTime | null) {
    if (!date) return '';
    const displayFormat = this.props.displayFormat ?? defaultProps.displayFormat;
    const value = typeof displayFormat === 'function' ? displayFormat(date) : null;
    if (typeof value === 'string') return value;
    return formatDate(date, {
      ...(value || displayFormat || { dateStyle: 'short' }),
    });
  }

  clearDate = () => {
    const { onDateChange, onFocusChange } = this.props;
    const reopenPickerOnClearDate = this.props.reopenPickerOnClearDate
      ?? defaultProps.reopenPickerOnClearDate;
    onDateChange(null);
    if (reopenPickerOnClearDate) {
      onFocusChange({ focused: true });
    }
  };

  override render() {
    const {
      children = defaultProps.children,
      id,
      placeholder = defaultProps.placeholder,
      ariaLabel = defaultProps.ariaLabel,
      autoComplete = defaultProps.autoComplete,
      titleText = defaultProps.titleText,
      disabled = defaultProps.disabled,
      focused = defaultProps.focused,
      isFocused = defaultProps.isFocused,
      required = defaultProps.required,
      readOnly = defaultProps.readOnly,
      openDirection = defaultProps.openDirection,
      showClearDate = defaultProps.showClearDate,
      showCaret = defaultProps.showCaret,
      showDefaultInputIcon = defaultProps.showDefaultInputIcon,
      inputIconPosition = defaultProps.inputIconPosition,
      customCloseIcon = defaultProps.customCloseIcon,
      customInputIcon = defaultProps.customInputIcon,
      date = defaultProps.date,
      phrases = defaultProps.phrases,
      onKeyDownArrowDown = defaultProps.onKeyDownArrowDown,
      onKeyDownQuestionMark = defaultProps.onKeyDownQuestionMark,
      screenReaderMessage = defaultProps.screenReaderMessage,
      isRTL = defaultProps.isRTL,
      noBorder = defaultProps.noBorder,
      block = defaultProps.block,
      small = defaultProps.small,
      regular = defaultProps.regular,
      verticalSpacing = defaultProps.verticalSpacing,
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
