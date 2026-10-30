import React from 'react';
import noop from '../utils/noop.js';
import { withStyles, noflip } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import type { SingleDatePickerInputProps } from '../types.js';

import { SingleDatePickerInputPhrases } from '../defaultPhrases.js';

import DateInput from './DateInput.js';

import CloseButton from './CloseButton.js';
import CalendarIcon from './CalendarIcon.js';

import { ICON_BEFORE_POSITION, ICON_AFTER_POSITION, OPEN_DOWN } from '../constants.js';

const defaultProps = {
  children: null,
  placeholder: 'Select Date',
  ariaLabel: undefined,
  autoComplete: 'off',
  titleText: undefined,
  displayValue: '',
  screenReaderMessage: '',
  focused: false,
  isFocused: false,
  disabled: false,
  required: false,
  readOnly: false,
  openDirection: OPEN_DOWN,
  showCaret: false,
  showClearDate: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  customCloseIcon: null,
  customInputIcon: null,
  isRTL: false,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  verticalSpacing: undefined,

  onChange: noop,
  onClearDate: noop,
  onFocus: noop,
  onKeyDownShiftTab: noop,
  onKeyDownTab: noop,
  onKeyDownArrowDown: noop,
  onKeyDownQuestionMark: noop,

  // i18n
  phrases: SingleDatePickerInputPhrases,
} satisfies Omit<SingleDatePickerInputProps, 'id'>;

type SingleDatePickerInputInternalProps = SingleDatePickerInputProps & WithStylesProps;

function SingleDatePickerInput({
  id,
  children = defaultProps.children,
  placeholder = defaultProps.placeholder,
  ariaLabel = defaultProps.ariaLabel,
  autoComplete = defaultProps.autoComplete,
  titleText = defaultProps.titleText,
  displayValue = defaultProps.displayValue,
  focused = defaultProps.focused,
  isFocused = defaultProps.isFocused,
  disabled = defaultProps.disabled,
  required = defaultProps.required,
  readOnly = defaultProps.readOnly,
  showCaret = defaultProps.showCaret,
  showClearDate = defaultProps.showClearDate,
  showDefaultInputIcon = defaultProps.showDefaultInputIcon,
  inputIconPosition = defaultProps.inputIconPosition,
  phrases = defaultProps.phrases,
  onClearDate = defaultProps.onClearDate,
  onChange = defaultProps.onChange,
  onFocus = defaultProps.onFocus,
  onKeyDownShiftTab = defaultProps.onKeyDownShiftTab,
  onKeyDownTab = defaultProps.onKeyDownTab,
  onKeyDownArrowDown = defaultProps.onKeyDownArrowDown,
  onKeyDownQuestionMark = defaultProps.onKeyDownQuestionMark,
  screenReaderMessage = defaultProps.screenReaderMessage,
  customCloseIcon = defaultProps.customCloseIcon,
  customInputIcon = defaultProps.customInputIcon,
  openDirection = defaultProps.openDirection,
  isRTL = defaultProps.isRTL,
  noBorder = defaultProps.noBorder,
  block = defaultProps.block,
  small = defaultProps.small,
  regular = defaultProps.regular,
  verticalSpacing = defaultProps.verticalSpacing,
  css,
  styles,
}: SingleDatePickerInputInternalProps) {
  const calendarIcon = customInputIcon || (
    <CalendarIcon {...css(styles.SingleDatePickerInput_calendarIcon_svg)} />
  );
  const closeIcon = customCloseIcon || (
    <CloseButton
      {...css(
        styles.SingleDatePickerInput_clearDate_svg,
        small && styles.SingleDatePickerInput_clearDate_svg__small,
      )}
    />
  );

  const screenReaderText = screenReaderMessage || phrases.keyboardForwardNavigationInstructions;
  const inputIcon = (showDefaultInputIcon || customInputIcon !== null) && (
    <button
      {...css(styles.SingleDatePickerInput_calendarIcon)}
      type="button"
      disabled={disabled}
      aria-label={phrases.focusDate}
      onClick={onFocus}
      tabIndex={-1}
    >
      {calendarIcon}
    </button>
  );

  return (
    <div
      {...css(
        styles.SingleDatePickerInput,
        disabled && styles.SingleDatePickerInput__disabled,
        isRTL && styles.SingleDatePickerInput__rtl,
        !noBorder && styles.SingleDatePickerInput__withBorder,
        block && styles.SingleDatePickerInput__block,
        showClearDate && styles.SingleDatePickerInput__showClearDate,
      )}
    >
      {inputIconPosition === ICON_BEFORE_POSITION && inputIcon}

      <DateInput
        id={id}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        autoComplete={autoComplete}
        titleText={titleText}
        displayValue={displayValue}
        screenReaderMessage={screenReaderText}
        focused={focused}
        isFocused={isFocused}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        showCaret={showCaret}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDownShiftTab={onKeyDownShiftTab}
        onKeyDownTab={onKeyDownTab}
        onKeyDownArrowDown={onKeyDownArrowDown}
        onKeyDownQuestionMark={onKeyDownQuestionMark}
        openDirection={openDirection}
        verticalSpacing={verticalSpacing}
        small={small}
        regular={regular}
        block={block}
      />

      {children}

      {showClearDate && (
        <button
          {...css(
            styles.SingleDatePickerInput_clearDate,
            small && styles.SingleDatePickerInput_clearDate__small,
            !customCloseIcon && styles.SingleDatePickerInput_clearDate__default,
            !displayValue && styles.SingleDatePickerInput_clearDate__hide,
          )}
          type="button"
          aria-label={phrases.clearDate}
          disabled={disabled}
          onClick={onClearDate}
        >
          {closeIcon}
        </button>
      )}

      {inputIconPosition === ICON_AFTER_POSITION && inputIcon}

    </div>
  );
}

export default withStyles(({ reactDates: { border, color } }) => ({
  SingleDatePickerInput: {
    display: 'inline-block',
    backgroundColor: color.background,
  },

  SingleDatePickerInput__withBorder: {
    borderColor: color.border,
    borderWidth: border.pickerInput.borderWidth,
    borderStyle: border.pickerInput.borderStyle,
    borderRadius: border.pickerInput.borderRadius,
  },

  SingleDatePickerInput__rtl: {
    direction: noflip('rtl'),
  },

  SingleDatePickerInput__disabled: {
    backgroundColor: color.disabled,
  },

  SingleDatePickerInput__block: {
    display: 'block',
  },

  SingleDatePickerInput__showClearDate: {
    paddingRight: 30, // TODO: should be noflip wrapped and handled by an isRTL prop
  },

  SingleDatePickerInput_clearDate: {
    background: 'none',
    border: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',

    cursor: 'pointer',
    padding: 10,
    margin: '0 10px 0 5px', // TODO: should be noflip wrapped and handled by an isRTL prop
    position: 'absolute',
    right: 0, // TODO: should be noflip wrapped and handled by an isRTL prop
    top: '50%',
    transform: 'translateY(-50%)',
  },

  SingleDatePickerInput_clearDate__default: {
    ':focus': {
      background: color.core.border,
      borderRadius: '50%',
    },

    ':hover': {
      background: color.core.border,
      borderRadius: '50%',
    },
  },

  SingleDatePickerInput_clearDate__small: {
    padding: 6,
  },

  SingleDatePickerInput_clearDate__hide: {
    visibility: 'hidden',
  },

  SingleDatePickerInput_clearDate_svg: {
    fill: color.core.grayLight,
    height: 12,
    width: 15,
    verticalAlign: 'middle',
  },

  SingleDatePickerInput_clearDate_svg__small: {
    height: 9,
  },

  SingleDatePickerInput_calendarIcon: {
    background: 'none',
    border: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',

    cursor: 'pointer',
    display: 'inline-block',
    verticalAlign: 'middle',
    padding: 10,
    margin: '0 5px 0 10px', // TODO: should be noflip wrapped and handled by an isRTL prop
  },

  SingleDatePickerInput_calendarIcon_svg: {
    fill: color.core.grayLight,
    height: 15,
    width: 14,
    verticalAlign: 'middle',
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(SingleDatePickerInput);
