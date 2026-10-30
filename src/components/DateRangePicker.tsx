import React from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import noop from '../utils/noop.js';
import { DateTime } from 'luxon';
import { withStyles, noflip } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import {
  Portal,
  addEventListener,
  getActiveElement,
  isTouchDevice,
  OutsideClickHandler,
  lockScroll,
} from '../internal/browser/index.js';

import type {
  DateRangePickerProps,
  FocusedInput,
} from '../types.js';
import { DateRangePickerPhrases } from '../defaultPhrases.js';

import getResponsiveContainerStyles from '../utils/getResponsiveContainerStyles.js';
import getDetachedContainerStyles from '../utils/getDetachedContainerStyles.js';
import getInputHeight from '../utils/getInputHeight.js';
import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay.js';

import DateRangePickerInputController from './DateRangePickerInputController.js';
import DayPickerRangeController from './DayPickerRangeController.js';
import CloseButton from './CloseButton.js';

import {
  START_DATE,
  END_DATE,
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  ANCHOR_LEFT,
  ANCHOR_RIGHT,
  OPEN_DOWN,
  OPEN_UP,
  DAY_SIZE,
  ICON_BEFORE_POSITION,
  INFO_POSITION_BOTTOM,
  FANG_HEIGHT_PX,
  DEFAULT_VERTICAL_SPACING,
  NAV_POSITION_TOP,
} from '../constants.js';

const defaultProps = {
  // required props for a functional interactive DateRangePicker
  startDate: null,
  endDate: null,
  focusedInput: null,

  // input related props
  startDatePlaceholderText: 'Start Date',
  endDatePlaceholderText: 'End Date',
  startDateAriaLabel: undefined,
  endDateAriaLabel: undefined,
  startDateTitleText: undefined,
  endDateTitleText: undefined,
  startDateOffset: undefined,
  endDateOffset: undefined,
  disabled: false,
  required: false,
  readOnly: false,
  screenReaderInputMessage: '',
  showClearDates: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  customInputIcon: null,
  customArrowIcon: null,
  customCloseIcon: null,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  keepFocusOnInput: false,

  // calendar presentation and interaction related props
  renderMonthText: null,
  renderWeekHeaderElement: null,
  orientation: HORIZONTAL_ORIENTATION,
  anchorDirection: ANCHOR_LEFT,
  openDirection: OPEN_DOWN,
  horizontalMargin: 0,
  withPortal: false,
  withFullScreenPortal: false,
  appendToBody: false,
  disableScroll: false,
  initialVisibleMonth: null,
  numberOfMonths: 2,
  keepOpenOnDateSelect: false,
  reopenPickerOnClearDates: false,
  renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  hideKeyboardShortcutsPanel: false,
  daySize: DAY_SIZE,
  isRTL: false,
  firstDayOfWeek: null,
  verticalHeight: null,
  transitionDuration: undefined,
  verticalSpacing: DEFAULT_VERTICAL_SPACING,
  autoComplete: 'off',
  horizontalMonthPadding: undefined,

  // navigation related props
  dayPickerNavigationInlineStyles: null,
  navPosition: NAV_POSITION_TOP,
  navPrev: null,
  navNext: null,
  renderNavPrevButton: null,
  renderNavNextButton: null,

  onPrevMonthClick: noop,
  onNextMonthClick: noop,

  onClose: noop,

  // day presentation and interaction related props
  renderCalendarDay: undefined,
  renderDayContents: null,
  renderMonthElement: null,
  minimumNights: 1,
  enableOutsideDays: false,
  isDayBlocked: () => false,
  isOutsideRange: (day) => !isInclusivelyAfterDay(day, DateTime.local()),
  isDayHighlighted: () => false,
  minDate: undefined,
  maxDate: undefined,

  // internationalization
  displayFormat: { dateStyle: 'short' },
  monthFormat: { month: 'long', year: 'numeric' },
  weekDayFormat: { weekday: 'short' },
  phrases: DateRangePickerPhrases,
  dayAriaLabelFormat: { dateStyle: 'full' },
} satisfies Partial<DateRangePickerProps>;

type OptionalUndefinedProps = 'startDateAriaLabel'
  | 'endDateAriaLabel'
  | 'startDateTitleText'
  | 'endDateTitleText'
  | 'startDateOffset'
  | 'endDateOffset'
  | 'transitionDuration'
  | 'horizontalMonthPadding'
  | 'renderCalendarDay'
  | 'minDate'
  | 'maxDate';
type DefaultedProps = Exclude<keyof typeof defaultProps, OptionalUndefinedProps>;
type DateRangePickerInternalProps = DateRangePickerProps
  & WithStylesProps
  & Required<Pick<DateRangePickerProps, DefaultedProps>>
  & Pick<DateRangePickerProps, OptionalUndefinedProps>;

interface DateRangePickerState {
  dayPickerContainerStyles: CSSProperties;
  isDateRangePickerInputFocused: boolean;
  isDayPickerFocused: boolean;
  showKeyboardShortcuts: boolean;
}

class DateRangePicker extends React.PureComponent<DateRangePickerProps, DateRangePickerState> {
  static defaultProps = defaultProps;

  declare readonly props: Readonly<DateRangePickerInternalProps>;

  private isTouchDevice = false;

  private dayPickerContainer: HTMLDivElement | null = null;

  private container: HTMLDivElement | null = null;

  private removeEventListener?: () => void;

  private removeDayPickerFocusOut?: () => void;

  private enableScroll?: () => void;

  private restoreFocusOnClose = false;

  private suppressRestoredInputFocus = false;

  constructor(props: DateRangePickerProps) {
    super(props);
    this.state = {
      dayPickerContainerStyles: {},
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    };

  }

  override componentDidMount() {
    // React 18 Strict Mode replays lifecycle cleanup without replaying callback refs.
    this.addDayPickerEventListeners();
    this.removeEventListener = addEventListener(
      window,
      'resize',
      this.responsivizePickerPosition,
      { passive: true },
    );
    this.responsivizePickerPosition();
    this.disableScroll();

    const { focusedInput } = this.props;
    if (focusedInput) {
      this.setState({
        isDateRangePickerInputFocused: true,
      });
    }

    this.isTouchDevice = isTouchDevice();
  }

  override componentDidUpdate(prevProps: DateRangePickerInternalProps) {
    const { focusedInput } = this.props;
    if (!prevProps.focusedInput && focusedInput && this.isOpened()) {
      // The date picker just changed from being closed to being open.
      this.responsivizePickerPosition();
      this.disableScroll();
    } else if (prevProps.focusedInput && !focusedInput && !this.isOpened()) {
      // The date picker just changed from being open to being closed.
      if (this.enableScroll) this.enableScroll();
      if (this.restoreFocusOnClose) {
        this.restoreFocusOnClose = false;
        const inputId = prevProps.focusedInput === END_DATE
          ? this.props.endDateId
          : this.props.startDateId;
        const input = Array.from(this.container?.querySelectorAll('input') || [])
          .find((element) => element.id === inputId);
        this.suppressRestoredInputFocus = true;
        input?.focus();
      }
    }
  }

  override componentWillUnmount() {
    this.removeDayPickerEventListeners();
    if (this.removeEventListener) this.removeEventListener();
    if (this.enableScroll) this.enableScroll();
  }

  onOutsideClick = (event: Event | ReactMouseEvent<HTMLElement>) => {
    const {
      onFocusChange,
      onClose,
      startDate,
      endDate,
      appendToBody,
    } = this.props;

    if (!this.isOpened()) return;
    if (appendToBody && event.target instanceof Node
      && this.dayPickerContainer?.contains(event.target)) return;

    this.setState({
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });

    onFocusChange(null);
    onClose({ startDate, endDate });
  };

  onDateRangePickerInputFocus = (focusedInput: FocusedInput) => {
    const {
      onFocusChange,
      readOnly,
      withPortal,
      withFullScreenPortal,
      keepFocusOnInput,
    } = this.props;

    if (focusedInput && this.suppressRestoredInputFocus) {
      this.suppressRestoredInputFocus = false;
      return;
    }

    if (focusedInput) {
      const withAnyPortal = withPortal || withFullScreenPortal;
      const moveFocusToDayPicker = withAnyPortal
        || (readOnly && !keepFocusOnInput)
        || (this.isTouchDevice && !keepFocusOnInput);

      if (moveFocusToDayPicker) {
        this.onDayPickerFocus();
      } else {
        this.onDayPickerBlur();
      }
    }

    onFocusChange(focusedInput);
  };

  onDayPickerFocus = () => {
    const { focusedInput, onFocusChange } = this.props;
    if (!focusedInput) onFocusChange(START_DATE);

    this.setState({
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: false,
    });
  };

  onDayPickerFocusOut = (event: FocusEvent) => {
    // In cases where **relatedTarget** is not null, it points to the right
    // element here. However, in cases where it is null (such as clicking on a
    // specific day) or it is **document.body** (IE11), the appropriate value is **event.target**.
    //
    // We handle both situations here by using the ` || ` operator to fallback
    // to *event.target** when **relatedTarget** is not provided.
    const relatedTarget = event.relatedTarget === document.body
      ? event.target
      : (event.relatedTarget || event.target);
    if (relatedTarget instanceof Node && this.dayPickerContainer?.contains(relatedTarget)) return;
    this.onOutsideClick(event);
  };

  onDayPickerBlur = () => {
    this.setState({
      isDateRangePickerInputFocused: true,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });
  };

  onDayPickerFocusChange = (focusedInput: FocusedInput) => {
    if (!focusedInput) {
      this.restoreFocusOnClose = Boolean(
        this.dayPickerContainer?.contains(getActiveElement()),
      );
      if (this.restoreFocusOnClose) {
        this.onDayPickerBlur();
      } else {
        this.setState({
          isDateRangePickerInputFocused: false,
          isDayPickerFocused: false,
          showKeyboardShortcuts: false,
        });
      }
    }
    this.props.onFocusChange(focusedInput);
  };

  onDayPickerEscape = () => {
    const { startDate, endDate, onClose } = this.props;
    this.onDayPickerFocusChange(null);
    onClose({ startDate, endDate });
  };

  setDayPickerContainerRef = (ref: HTMLDivElement | null) => {
    if (ref === this.dayPickerContainer) return;
    if (this.dayPickerContainer) this.removeDayPickerEventListeners();

    this.dayPickerContainer = ref;
    if (!ref) return;

    this.addDayPickerEventListeners();
  };

  setContainerRef = (ref: HTMLDivElement | null) => {
    this.container = ref;
  };

  addDayPickerEventListeners() {
    this.removeDayPickerEventListeners();
    // NOTE: We are using a manual event listener here, because React doesn't
    // provide FocusOut, while blur and keydown don't provide the information
    // needed in order to know whether we have left focus or not.
    //
    // For reference, this issue is further described here:
    // - https://github.com/facebook/react/issues/6410
    this.removeDayPickerFocusOut = addEventListener(
      this.dayPickerContainer,
      'focusout',
      this.onDayPickerFocusOut,
    );
  }

  removeDayPickerEventListeners() {
    if (this.removeDayPickerFocusOut) this.removeDayPickerFocusOut();
  }

  isOpened() {
    const { focusedInput } = this.props;
    return focusedInput === START_DATE || focusedInput === END_DATE;
  }

  disableScroll = () => {
    const { appendToBody, disableScroll: propDisableScroll } = this.props;
    if (!appendToBody && !propDisableScroll) return;
    if (!this.isOpened()) return;

    this.enableScroll = lockScroll();
  };

  responsivizePickerPosition = () => {
    // It's possible the portal props have been changed in response to window resizes
    // So let's ensure we reset this back to the base state each time
    const { dayPickerContainerStyles } = this.state;

    if (Object.keys(dayPickerContainerStyles).length > 0) {
      this.setState({ dayPickerContainerStyles: {} });
    }

    if (!this.isOpened()) {
      return;
    }

    const {
      openDirection,
      anchorDirection,
      horizontalMargin,
      withPortal,
      withFullScreenPortal,
      appendToBody,
    } = this.props;

    if (!withPortal && !withFullScreenPortal) {
      const containerRect = this.dayPickerContainer?.getBoundingClientRect();
      if (!containerRect) return;
      const currentStyleOffset = dayPickerContainerStyles[anchorDirection];
      const currentOffset = typeof currentStyleOffset === 'number' ? currentStyleOffset : 0;
      this.setState({
        dayPickerContainerStyles: {
          ...getResponsiveContainerStyles(
            anchorDirection,
            currentOffset,
            containerRect,
            horizontalMargin,
          ),
          ...(appendToBody && this.container
            ? getDetachedContainerStyles(openDirection, anchorDirection, this.container)
            : {}),
        },
      });
    }
  };

  showKeyboardShortcutsPanel = () => {
    this.setState({
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: true,
    });
  };

  maybeRenderDayPickerWithPortal() {
    const { withPortal, withFullScreenPortal, appendToBody } = this.props;

    if (!this.isOpened()) {
      return null;
    }

    if (withPortal || withFullScreenPortal || appendToBody) {
      return (
        <Portal>
          {this.renderDayPicker()}
        </Portal>
      );
    }

    return this.renderDayPicker();
  }

  renderDayPicker() {
    const {
      anchorDirection,
      openDirection,
      isDayBlocked,
      isDayHighlighted,
      isOutsideRange,
      numberOfMonths,
      orientation,
      monthFormat,
      renderMonthText,
      renderWeekHeaderElement,
      dayPickerNavigationInlineStyles,
      navPosition,
      navPrev,
      navNext,
      renderNavPrevButton,
      renderNavNextButton,
      onPrevMonthClick,
      onNextMonthClick,
      onDatesChange,
      withPortal,
      withFullScreenPortal,
      daySize,
      enableOutsideDays,
      focusedInput,
      startDate,
      startDateOffset,
      endDate,
      endDateOffset,
      minDate,
      maxDate,
      minimumNights,
      keepOpenOnDateSelect,
      renderCalendarDay,
      renderDayContents,
      renderCalendarInfo,
      renderMonthElement,
      calendarInfoPosition,
      firstDayOfWeek,
      initialVisibleMonth,
      hideKeyboardShortcutsPanel,
      customCloseIcon,
      onClose,
      phrases,
      dayAriaLabelFormat,
      isRTL,
      weekDayFormat,
      css,
      styles,
      verticalHeight,
      noBorder,
      transitionDuration,
      verticalSpacing,
      horizontalMonthPadding,
      small,
      disabled,
      theme: { reactDates },
    } = this.props;

    const { dayPickerContainerStyles, isDayPickerFocused, showKeyboardShortcuts } = this.state;

    const onOutsideClick = (!withFullScreenPortal && withPortal)
      ? this.onOutsideClick
      : undefined;
    const initialVisibleMonthThunk = initialVisibleMonth || (
      () => (startDate || endDate || DateTime.local())
    );

    const closeIcon = customCloseIcon || (
      <CloseButton {...css(styles.DateRangePicker_closeButton_svg)} />
    );

    const inputHeight = getInputHeight(reactDates, small);

    const withAnyPortal = withPortal || withFullScreenPortal;

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    return (
      <div
        key="day-picker"
        ref={this.setDayPickerContainerRef}
        {...css(
          styles.DateRangePicker_picker,
          !noBorder && styles.DateRangePicker_picker__withBorder,
          anchorDirection === ANCHOR_LEFT && styles.DateRangePicker_picker__directionLeft,
          anchorDirection === ANCHOR_RIGHT && styles.DateRangePicker_picker__directionRight,
          orientation === HORIZONTAL_ORIENTATION && styles.DateRangePicker_picker__horizontal,
          orientation === VERTICAL_ORIENTATION && styles.DateRangePicker_picker__vertical,
          !withAnyPortal && openDirection === OPEN_DOWN && {
            top: inputHeight + verticalSpacing,
          },
          !withAnyPortal && openDirection === OPEN_UP && {
            bottom: inputHeight + verticalSpacing,
          },
          withAnyPortal && styles.DateRangePicker_picker__portal,
          withFullScreenPortal && styles.DateRangePicker_picker__fullScreenPortal,
          isRTL && styles.DateRangePicker_picker__rtl,
          dayPickerContainerStyles,
        )}
        onClick={onOutsideClick}
      >
        <DayPickerRangeController
          {...(renderMonthText
            ? { renderMonthText, renderMonthElement: null }
            : { renderMonthText: null, renderMonthElement })}
          orientation={orientation}
          enableOutsideDays={enableOutsideDays}
          numberOfMonths={numberOfMonths}
          onPrevMonthClick={onPrevMonthClick}
          onNextMonthClick={onNextMonthClick}
          onDatesChange={onDatesChange}
          onFocusChange={this.onDayPickerFocusChange}
          onClose={onClose}
          focusedInput={focusedInput}
          startDate={startDate}
          startDateOffset={startDateOffset}
          endDate={endDate}
          endDateOffset={endDateOffset}
          minDate={minDate}
          maxDate={maxDate}
          monthFormat={monthFormat}
          renderWeekHeaderElement={renderWeekHeaderElement}
          withPortal={withAnyPortal}
          daySize={daySize}
          initialVisibleMonth={initialVisibleMonthThunk}
          hideKeyboardShortcutsPanel={hideKeyboardShortcutsPanel}
          dayPickerNavigationInlineStyles={dayPickerNavigationInlineStyles}
          navPosition={navPosition}
          navPrev={navPrev}
          navNext={navNext}
          renderNavPrevButton={renderNavPrevButton}
          renderNavNextButton={renderNavNextButton}
          minimumNights={minimumNights}
          isOutsideRange={isOutsideRange}
          isDayHighlighted={isDayHighlighted}
          isDayBlocked={isDayBlocked}
          keepOpenOnDateSelect={keepOpenOnDateSelect}
          renderCalendarDay={renderCalendarDay}
          renderDayContents={renderDayContents}
          renderCalendarInfo={renderCalendarInfo}
          calendarInfoPosition={calendarInfoPosition}
          isFocused={isDayPickerFocused}
          showKeyboardShortcuts={showKeyboardShortcuts}
          onBlur={this.onDayPickerBlur}
          onEscape={this.onDayPickerEscape}
          phrases={phrases}
          dayAriaLabelFormat={dayAriaLabelFormat}
          isRTL={isRTL}
          firstDayOfWeek={firstDayOfWeek}
          weekDayFormat={weekDayFormat}
          verticalHeight={verticalHeight}
          noBorder={noBorder}
          transitionDuration={transitionDuration}
          disabled={disabled}
          horizontalMonthPadding={horizontalMonthPadding}
        />

        {withFullScreenPortal && (
          <button
            {...css(styles.DateRangePicker_closeButton)}
            type="button"
            onClick={this.onOutsideClick}
            aria-label={phrases.closeDatePicker}
            tabIndex={-1}
          >
            {closeIcon}
          </button>
        )}
      </div>
    );
    /* eslint-enable jsx-a11y/no-static-element-interactions */
    /* eslint-enable jsx-a11y/click-events-have-key-events */
  }

  override render() {
    const {
      startDate,
      startDateId,
      startDatePlaceholderText,
      startDateAriaLabel,
      startDateTitleText,
      endDate,
      endDateId,
      endDatePlaceholderText,
      endDateAriaLabel,
      endDateTitleText,
      focusedInput,
      screenReaderInputMessage,
      showClearDates,
      showDefaultInputIcon,
      inputIconPosition,
      customInputIcon,
      customArrowIcon,
      customCloseIcon,
      disabled,
      required,
      readOnly,
      autoComplete,
      openDirection,
      phrases,
      isOutsideRange,
      isDayBlocked,
      minimumNights,
      withPortal,
      withFullScreenPortal,
      displayFormat,
      reopenPickerOnClearDates,
      keepOpenOnDateSelect,
      onDatesChange,
      onClose,
      isRTL,
      noBorder,
      block,
      verticalSpacing,
      small,
      regular,
      css,
      styles,
    } = this.props;

    const { isDateRangePickerInputFocused } = this.state;

    const enableOutsideClick = (!withPortal && !withFullScreenPortal);

    const hideFang = verticalSpacing < FANG_HEIGHT_PX;

    const input = (
      <DateRangePickerInputController
        startDate={startDate}
        startDateId={startDateId}
        startDatePlaceholderText={startDatePlaceholderText}
        isStartDateFocused={focusedInput === START_DATE}
        startDateAriaLabel={startDateAriaLabel}
        startDateTitleText={startDateTitleText}
        endDate={endDate}
        endDateId={endDateId}
        endDatePlaceholderText={endDatePlaceholderText}
        isEndDateFocused={focusedInput === END_DATE}
        endDateAriaLabel={endDateAriaLabel}
        endDateTitleText={endDateTitleText}
        displayFormat={displayFormat}
        showClearDates={showClearDates}
        showCaret={!withPortal && !withFullScreenPortal && !hideFang}
        showDefaultInputIcon={showDefaultInputIcon}
        inputIconPosition={inputIconPosition}
        customInputIcon={customInputIcon}
        customArrowIcon={customArrowIcon}
        customCloseIcon={customCloseIcon}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        openDirection={openDirection}
        reopenPickerOnClearDates={reopenPickerOnClearDates}
        keepOpenOnDateSelect={keepOpenOnDateSelect}
        isOutsideRange={isOutsideRange}
        isDayBlocked={isDayBlocked}
        minimumNights={minimumNights}
        withFullScreenPortal={withFullScreenPortal}
        onDatesChange={onDatesChange}
        onFocusChange={this.onDateRangePickerInputFocus}
        onKeyDownArrowDown={this.onDayPickerFocus}
        onKeyDownQuestionMark={this.showKeyboardShortcutsPanel}
        onClose={onClose}
        phrases={phrases}
        screenReaderMessage={screenReaderInputMessage}
        isFocused={isDateRangePickerInputFocused}
        isRTL={isRTL}
        noBorder={noBorder}
        block={block}
        small={small}
        regular={regular}
        verticalSpacing={verticalSpacing}
        autoComplete={autoComplete}
      >
        {this.maybeRenderDayPickerWithPortal()}
      </DateRangePickerInputController>
    );

    return (
      <div
        ref={this.setContainerRef}
        {...css(
          styles.DateRangePicker,
          block && styles.DateRangePicker__block,
        )}
      >
        {enableOutsideClick && (
          <OutsideClickHandler onOutsideClick={this.onOutsideClick}>
            {input}
          </OutsideClickHandler>
        )}
        {enableOutsideClick || input}
      </div>
    );
  }
}

export { DateRangePicker as PureDateRangePicker };
export default withStyles(({ reactDates: { color, zIndex } }) => ({
  DateRangePicker: {
    position: 'relative',
    display: 'inline-block',
  },

  DateRangePicker__block: {
    display: 'block',
  },

  DateRangePicker_picker: {
    zIndex: zIndex + 1,
    backgroundColor: color.background,
    position: 'absolute',
    overflowX: 'hidden',
  },

  DateRangePicker_picker__withBorder: {
    boxShadow: noflip('0 2px 6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.07)'),
    borderRadius: 3,
  },

  DateRangePicker_picker__rtl: {
    direction: noflip('rtl'),
  },

  DateRangePicker_picker__directionLeft: {
    left: noflip(0),
  },

  DateRangePicker_picker__directionRight: {
    right: noflip(0),
  },

  DateRangePicker_picker__portal: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'fixed',
    top: 0,
    left: noflip(0),
    height: '100%',
    width: '100%',
  },

  DateRangePicker_picker__fullScreenPortal: {
    backgroundColor: color.background,
  },

  DateRangePicker_closeButton: {
    background: 'none',
    border: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',
    cursor: 'pointer',

    position: 'absolute',
    top: 0,
    right: noflip(0),
    padding: 15,
    zIndex: zIndex + 2,

    ':hover': {
      color: color.core.grayLighter,
      textDecoration: 'none',
    },

    ':focus': {
      color: color.core.grayLighter,
      textDecoration: 'none',
    },
  },

  DateRangePicker_closeButton_svg: {
    height: 15,
    width: 15,
    fill: color.core.grayLighter,
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })<
DateRangePickerInternalProps,
DateRangePickerProps
>(DateRangePicker);
