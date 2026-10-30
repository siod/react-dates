import React from 'react';
import { DateTime } from 'luxon';
import noop from '../utils/noop.js';
import { formatDate, parseLocalizedDate } from '../internal/date/index.js';
import type { DateRangePickerInputControllerProps } from '../types.js';

import { DateRangePickerInputPhrases } from '../defaultPhrases.js';

import DateRangePickerInput from './DateRangePickerInput.js';

import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay.js';
import isBeforeDay from '../utils/isBeforeDay.js';

import {
  START_DATE,
  END_DATE,
  ICON_BEFORE_POSITION,
  OPEN_DOWN,
} from '../constants.js';

const defaultProps = {
  children: null,

  startDate: null,
  startDateId: START_DATE,
  startDatePlaceholderText: 'Start Date',
  isStartDateFocused: false,
  startDateAriaLabel: undefined,
  startDateTitleText: undefined,

  endDate: null,
  endDateId: END_DATE,
  endDatePlaceholderText: 'End Date',
  isEndDateFocused: false,
  endDateAriaLabel: undefined,
  endDateTitleText: undefined,

  screenReaderMessage: '',
  showClearDates: false,
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
  autoComplete: 'off',

  keepOpenOnDateSelect: false,
  reopenPickerOnClearDates: false,
  withFullScreenPortal: false,
  minimumNights: 1,
  isOutsideRange: (day) => !isInclusivelyAfterDay(day, DateTime.local()),
  isDayBlocked: () => false,
  displayFormat: { dateStyle: 'short' },

  onFocusChange: noop,
  onClose: noop,
  onDatesChange: noop,
  onKeyDownArrowDown: noop,
  onKeyDownQuestionMark: noop,

  customInputIcon: null,
  customArrowIcon: null,
  customCloseIcon: null,

  // accessibility
  isFocused: false,

  // i18n
  phrases: DateRangePickerInputPhrases,

  isRTL: false,
} satisfies DateRangePickerInputControllerProps;

export default class DateRangePickerInputController extends React.PureComponent<
DateRangePickerInputControllerProps
> {
  static defaultProps = defaultProps;

  onClearFocus = () => {
    const {
      onFocusChange = defaultProps.onFocusChange,
      onClose = defaultProps.onClose,
      startDate = defaultProps.startDate,
      endDate = defaultProps.endDate,
    } = this.props;

    onFocusChange(null);
    onClose({ startDate, endDate });
  };

  onEndDateChange = (endDateString: string) => {
    const {
      startDate = defaultProps.startDate,
      isOutsideRange = defaultProps.isOutsideRange,
      isDayBlocked = defaultProps.isDayBlocked,
      minimumNights = defaultProps.minimumNights,
      keepOpenOnDateSelect = defaultProps.keepOpenOnDateSelect,
      onDatesChange = defaultProps.onDatesChange,
      onClose = defaultProps.onClose,
      onFocusChange = defaultProps.onFocusChange,
    } = this.props;

    const endDate = this.parseDate(endDateString);

    const isEndDateValid = endDate
      && !isOutsideRange(endDate) && !isDayBlocked(endDate)
      && !(startDate && isBeforeDay(endDate, startDate.plus({ days: minimumNights })));
    if (isEndDateValid) {
      onDatesChange({ startDate, endDate });
      if (!keepOpenOnDateSelect) {
        onFocusChange(null);
        onClose({ startDate, endDate });
      }
    } else {
      onDatesChange({
        startDate,
        endDate: null,
      });
    }
  };

  onEndDateFocus = () => {
    const {
      startDate = defaultProps.startDate,
      onFocusChange = defaultProps.onFocusChange,
      withFullScreenPortal = defaultProps.withFullScreenPortal,
      disabled = defaultProps.disabled,
    } = this.props;

    if (!startDate && withFullScreenPortal && (!disabled || disabled === END_DATE)) {
      // When the datepicker is full screen, we never want to focus the end date first
      // because there's no indication that that is the case once the datepicker is open and it
      // might confuse the user
      onFocusChange(START_DATE);
    } else if (!disabled || disabled === START_DATE) {
      onFocusChange(END_DATE);
    }
  };

  onStartDateChange = (startDateString: string) => {
    let endDate = this.props.endDate ?? defaultProps.endDate;
    const {
      isOutsideRange = defaultProps.isOutsideRange,
      isDayBlocked = defaultProps.isDayBlocked,
      minimumNights = defaultProps.minimumNights,
      onDatesChange = defaultProps.onDatesChange,
      onFocusChange = defaultProps.onFocusChange,
      disabled = defaultProps.disabled,
    } = this.props;

    const startDate = this.parseDate(startDateString);
    const isEndDateBeforeStartDate = startDate
      && endDate && isBeforeDay(endDate, startDate.plus({ days: minimumNights }));
    const isStartDateValid = startDate
      && !isOutsideRange(startDate) && !isDayBlocked(startDate)
      && !(disabled === END_DATE && isEndDateBeforeStartDate);

    if (isStartDateValid) {
      if (isEndDateBeforeStartDate) {
        endDate = null;
      }

      onDatesChange({ startDate, endDate });
      onFocusChange(END_DATE);
    } else {
      onDatesChange({
        startDate: null,
        endDate,
      });
    }
  };

  onStartDateFocus = () => {
    const disabled = this.props.disabled ?? defaultProps.disabled;
    const onFocusChange = this.props.onFocusChange ?? defaultProps.onFocusChange;

    if (!disabled || disabled === END_DATE) {
      onFocusChange(START_DATE);
    }
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

  clearDates = () => {
    const onDatesChange = this.props.onDatesChange ?? defaultProps.onDatesChange;
    const reopenPickerOnClearDates = this.props.reopenPickerOnClearDates
      ?? defaultProps.reopenPickerOnClearDates;
    const onFocusChange = this.props.onFocusChange ?? defaultProps.onFocusChange;
    onDatesChange({ startDate: null, endDate: null });
    if (reopenPickerOnClearDates) {
      onFocusChange(START_DATE);
    }
  };

  override render() {
    const {
      children = defaultProps.children,
      startDate = defaultProps.startDate,
      startDateId = defaultProps.startDateId,
      startDatePlaceholderText = defaultProps.startDatePlaceholderText,
      isStartDateFocused = defaultProps.isStartDateFocused,
      startDateAriaLabel = defaultProps.startDateAriaLabel,
      startDateTitleText = defaultProps.startDateTitleText,
      endDate = defaultProps.endDate,
      endDateId = defaultProps.endDateId,
      endDatePlaceholderText = defaultProps.endDatePlaceholderText,
      endDateAriaLabel = defaultProps.endDateAriaLabel,
      endDateTitleText = defaultProps.endDateTitleText,
      isEndDateFocused = defaultProps.isEndDateFocused,
      screenReaderMessage = defaultProps.screenReaderMessage,
      showClearDates = defaultProps.showClearDates,
      showCaret = defaultProps.showCaret,
      showDefaultInputIcon = defaultProps.showDefaultInputIcon,
      inputIconPosition = defaultProps.inputIconPosition,
      customInputIcon = defaultProps.customInputIcon,
      customArrowIcon = defaultProps.customArrowIcon,
      customCloseIcon = defaultProps.customCloseIcon,
      disabled = defaultProps.disabled,
      required = defaultProps.required,
      readOnly = defaultProps.readOnly,
      openDirection = defaultProps.openDirection,
      isFocused = defaultProps.isFocused,
      phrases = defaultProps.phrases,
      onKeyDownArrowDown = defaultProps.onKeyDownArrowDown,
      onKeyDownQuestionMark = defaultProps.onKeyDownQuestionMark,
      isRTL = defaultProps.isRTL,
      noBorder = defaultProps.noBorder,
      block = defaultProps.block,
      small = defaultProps.small,
      regular = defaultProps.regular,
      verticalSpacing = defaultProps.verticalSpacing,
      autoComplete = defaultProps.autoComplete,
    } = this.props;

    const startDateString = this.getDateString(startDate);
    const endDateString = this.getDateString(endDate);

    return (
      <DateRangePickerInput
        startDate={startDateString}
        startDateId={startDateId}
        startDatePlaceholderText={startDatePlaceholderText}
        isStartDateFocused={isStartDateFocused}
        startDateAriaLabel={startDateAriaLabel}
        startDateTitleText={startDateTitleText}
        endDate={endDateString}
        endDateId={endDateId}
        endDatePlaceholderText={endDatePlaceholderText}
        isEndDateFocused={isEndDateFocused}
        endDateAriaLabel={endDateAriaLabel}
        endDateTitleText={endDateTitleText}
        isFocused={isFocused}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        openDirection={openDirection}
        showCaret={showCaret}
        showDefaultInputIcon={showDefaultInputIcon}
        inputIconPosition={inputIconPosition}
        customInputIcon={customInputIcon}
        customArrowIcon={customArrowIcon}
        customCloseIcon={customCloseIcon}
        phrases={phrases}
        onStartDateChange={this.onStartDateChange}
        onStartDateFocus={this.onStartDateFocus}
        onStartDateShiftTab={this.onClearFocus}
        onEndDateChange={this.onEndDateChange}
        onEndDateFocus={this.onEndDateFocus}
        showClearDates={showClearDates}
        onClearDates={this.clearDates}
        screenReaderMessage={screenReaderMessage}
        onKeyDownArrowDown={onKeyDownArrowDown}
        onKeyDownQuestionMark={onKeyDownQuestionMark}
        isRTL={isRTL}
        noBorder={noBorder}
        block={block}
        small={small}
        regular={regular}
        verticalSpacing={verticalSpacing}
        autoComplete={autoComplete}
      >
        {children}
      </DateRangePickerInput>
    );
  }
}
