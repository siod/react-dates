import React from 'react';
import type { ReactNode } from 'react';
import noop from '../utils/noop.js';
import { withStyles, noflip } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import type { DateRangePickerInputProps } from '../types.js';

import { DateRangePickerInputPhrases } from '../defaultPhrases.js';

import DateInput from './DateInput.js';

import RightArrow from './RightArrow.js';
import LeftArrow from './LeftArrow.js';
import CloseButton from './CloseButton.js';
import CalendarIcon from './CalendarIcon.js';

import {
  START_DATE,
  END_DATE,
  ICON_BEFORE_POSITION,
  ICON_AFTER_POSITION,
  OPEN_DOWN,
} from '../constants.js';

const defaultProps = {
  children: null,
  startDateId: START_DATE,
  endDateId: END_DATE,
  startDatePlaceholderText: 'Start Date',
  endDatePlaceholderText: 'End Date',
  startDateAriaLabel: undefined,
  endDateAriaLabel: undefined,
  startDateTitleText: undefined,
  endDateTitleText: undefined,
  screenReaderMessage: '',
  autoComplete: 'off',
  onStartDateFocus: noop,
  onEndDateFocus: noop,
  onStartDateChange: noop,
  onEndDateChange: noop,
  onStartDateShiftTab: noop,
  onEndDateTab: noop,
  onClearDates: noop,
  onKeyDownArrowDown: noop,
  onKeyDownQuestionMark: noop,

  startDate: '',
  endDate: '',

  isStartDateFocused: false,
  isEndDateFocused: false,
  showClearDates: false,
  disabled: false,
  required: false,
  readOnly: false,
  openDirection: OPEN_DOWN,
  showCaret: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  customInputIcon: null,
  customArrowIcon: null,
  customCloseIcon: null,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  verticalSpacing: undefined,

  // accessibility
  isFocused: false,

  // i18n
  phrases: DateRangePickerInputPhrases,

  isRTL: false,
} satisfies DateRangePickerInputProps;

type DateRangePickerInputInternalProps = DateRangePickerInputProps & WithStylesProps;

function DateRangePickerInput({
  children = defaultProps.children,
  startDate = defaultProps.startDate,
  startDateId = defaultProps.startDateId,
  startDatePlaceholderText = defaultProps.startDatePlaceholderText,
  screenReaderMessage = defaultProps.screenReaderMessage,
  isStartDateFocused = defaultProps.isStartDateFocused,
  onStartDateChange = defaultProps.onStartDateChange,
  onStartDateFocus = defaultProps.onStartDateFocus,
  onStartDateShiftTab = defaultProps.onStartDateShiftTab,
  startDateAriaLabel = defaultProps.startDateAriaLabel,
  startDateTitleText = defaultProps.startDateTitleText,
  endDate = defaultProps.endDate,
  endDateId = defaultProps.endDateId,
  endDatePlaceholderText = defaultProps.endDatePlaceholderText,
  isEndDateFocused = defaultProps.isEndDateFocused,
  onEndDateChange = defaultProps.onEndDateChange,
  onEndDateFocus = defaultProps.onEndDateFocus,
  onEndDateTab = defaultProps.onEndDateTab,
  endDateAriaLabel = defaultProps.endDateAriaLabel,
  endDateTitleText = defaultProps.endDateTitleText,
  onKeyDownArrowDown = defaultProps.onKeyDownArrowDown,
  onKeyDownQuestionMark = defaultProps.onKeyDownQuestionMark,
  onClearDates = defaultProps.onClearDates,
  showClearDates = defaultProps.showClearDates,
  disabled = defaultProps.disabled,
  required = defaultProps.required,
  readOnly = defaultProps.readOnly,
  autoComplete = defaultProps.autoComplete,
  showCaret = defaultProps.showCaret,
  openDirection = defaultProps.openDirection,
  showDefaultInputIcon = defaultProps.showDefaultInputIcon,
  inputIconPosition = defaultProps.inputIconPosition,
  customInputIcon = defaultProps.customInputIcon,
  customArrowIcon = defaultProps.customArrowIcon,
  customCloseIcon = defaultProps.customCloseIcon,
  isFocused = defaultProps.isFocused,
  phrases = defaultProps.phrases,
  isRTL = defaultProps.isRTL,
  noBorder = defaultProps.noBorder,
  block = defaultProps.block,
  verticalSpacing = defaultProps.verticalSpacing,
  small = defaultProps.small,
  regular = defaultProps.regular,
  css,
  styles,
}: DateRangePickerInputInternalProps) {
  const calendarIcon = customInputIcon || (
    <CalendarIcon {...css(styles.DateRangePickerInput_calendarIcon_svg)} />
  );
  let arrowIcon: ReactNode = <RightArrow {...css(styles.DateRangePickerInput_arrow_svg)} />;
  if (isRTL) arrowIcon = <LeftArrow {...css(styles.DateRangePickerInput_arrow_svg)} />;
  if (small) arrowIcon = '-';
  if (customArrowIcon) arrowIcon = customArrowIcon;

  const closeIcon = customCloseIcon || (
    <CloseButton
      {...css(
        styles.DateRangePickerInput_clearDates_svg,
        small && styles.DateRangePickerInput_clearDates_svg__small,
      )}
    />
  );

  const screenReaderStartDateText = screenReaderMessage
    || phrases.keyboardForwardNavigationInstructions;
  const screenReaderEndDateText = screenReaderMessage
    || phrases.keyboardBackwardNavigationInstructions;

  const inputIcon = (showDefaultInputIcon || customInputIcon !== null) && (
    <button
      {...css(styles.DateRangePickerInput_calendarIcon)}
      type="button"
      disabled={Boolean(disabled)}
      aria-label={phrases.focusStartDate}
      onClick={onKeyDownArrowDown}
    >
      {calendarIcon}
    </button>
  );

  const startDateDisabled = disabled === START_DATE || disabled === true;
  const endDateDisabled = disabled === END_DATE || disabled === true;

  return (
    <div
      {...css(
        styles.DateRangePickerInput,
        disabled && styles.DateRangePickerInput__disabled,
        isRTL && styles.DateRangePickerInput__rtl,
        !noBorder && styles.DateRangePickerInput__withBorder,
        block && styles.DateRangePickerInput__block,
        showClearDates && styles.DateRangePickerInput__showClearDates,
      )}
    >
      {inputIconPosition === ICON_BEFORE_POSITION && inputIcon}

      <DateInput
        id={startDateId}
        placeholder={startDatePlaceholderText}
        ariaLabel={startDateAriaLabel}
        autoComplete={autoComplete}
        titleText={startDateTitleText}
        displayValue={startDate}
        screenReaderMessage={screenReaderStartDateText}
        focused={isStartDateFocused}
        isFocused={isFocused}
        disabled={startDateDisabled}
        required={required}
        readOnly={readOnly}
        showCaret={showCaret}
        openDirection={openDirection}
        onChange={onStartDateChange}
        onFocus={onStartDateFocus}
        onKeyDownShiftTab={onStartDateShiftTab}
        onKeyDownArrowDown={onKeyDownArrowDown}
        onKeyDownQuestionMark={onKeyDownQuestionMark}
        verticalSpacing={verticalSpacing}
        small={small}
        regular={regular}
      />

      {!isEndDateFocused && children}

      <div
        {...css(styles.DateRangePickerInput_arrow)}
        aria-hidden="true"
        role="presentation"
      >
        {arrowIcon}
      </div>

      <DateInput
        id={endDateId}
        placeholder={endDatePlaceholderText}
        ariaLabel={endDateAriaLabel}
        autoComplete={autoComplete}
        titleText={endDateTitleText}
        displayValue={endDate}
        screenReaderMessage={screenReaderEndDateText}
        focused={isEndDateFocused}
        isFocused={isFocused}
        disabled={endDateDisabled}
        required={required}
        readOnly={readOnly}
        showCaret={showCaret}
        openDirection={openDirection}
        onChange={onEndDateChange}
        onFocus={onEndDateFocus}
        onKeyDownArrowDown={onKeyDownArrowDown}
        onKeyDownQuestionMark={onKeyDownQuestionMark}
        onKeyDownTab={onEndDateTab}
        verticalSpacing={verticalSpacing}
        small={small}
        regular={regular}
      />

      {isEndDateFocused && children}

      {showClearDates && (
        <button
          type="button"
          aria-label={phrases.clearDates}
          {...css(
            styles.DateRangePickerInput_clearDates,
            small && styles.DateRangePickerInput_clearDates__small,
            !customCloseIcon && styles.DateRangePickerInput_clearDates_default,
            !(startDate || endDate) && styles.DateRangePickerInput_clearDates__hide,
          )}
          onClick={onClearDates}
          disabled={Boolean(disabled)}
        >
          {closeIcon}
        </button>
      )}

      {inputIconPosition === ICON_AFTER_POSITION && inputIcon}
    </div>
  );
}

export default withStyles(({ reactDates: { border, color, sizing } }) => ({
  DateRangePickerInput: {
    backgroundColor: color.background,
    display: 'inline-block',
  },

  DateRangePickerInput__disabled: {
    background: color.disabled,
  },

  DateRangePickerInput__withBorder: {
    borderColor: color.border,
    borderWidth: border.pickerInput.borderWidth,
    borderStyle: border.pickerInput.borderStyle,
    borderRadius: border.pickerInput.borderRadius,
  },

  DateRangePickerInput__rtl: {
    direction: noflip('rtl'),
  },

  DateRangePickerInput__block: {
    display: 'block',
  },

  DateRangePickerInput__showClearDates: {
    paddingRight: 30, // TODO: should be noflip wrapped and handled by an isRTL prop
  },

  DateRangePickerInput_arrow: {
    display: 'inline-block',
    verticalAlign: 'middle',
    color: color.text,
  },

  DateRangePickerInput_arrow_svg: {
    verticalAlign: 'middle',
    fill: color.text,
    height: sizing.arrowWidth,
    width: sizing.arrowWidth,
  },

  DateRangePickerInput_clearDates: {
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

  DateRangePickerInput_clearDates__small: {
    padding: 6,
  },

  DateRangePickerInput_clearDates_default: {
    ':focus': {
      background: color.core.border,
      borderRadius: '50%',
    },

    ':hover': {
      background: color.core.border,
      borderRadius: '50%',
    },
  },

  DateRangePickerInput_clearDates__hide: {
    visibility: 'hidden',
  },

  DateRangePickerInput_clearDates_svg: {
    fill: color.core.grayLight,
    height: 12,
    width: 15,
    verticalAlign: 'middle',
  },

  DateRangePickerInput_clearDates_svg__small: {
    height: 9,
  },

  DateRangePickerInput_calendarIcon: {
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

  DateRangePickerInput_calendarIcon_svg: {
    fill: color.core.grayLight,
    height: 15,
    width: 14,
    verticalAlign: 'middle',
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(DateRangePickerInput);
