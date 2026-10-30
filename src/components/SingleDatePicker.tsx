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

import type { SingleDatePickerProps } from '../types.js';
import { SingleDatePickerPhrases } from '../defaultPhrases.js';

import getResponsiveContainerStyles from '../utils/getResponsiveContainerStyles.js';
import getDetachedContainerStyles from '../utils/getDetachedContainerStyles.js';
import getInputHeight from '../utils/getInputHeight.js';
import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay.js';

import SingleDatePickerInputController from './SingleDatePickerInputController.js';
import DayPickerSingleDateController from './DayPickerSingleDateController.js';
import CloseButton from './CloseButton.js';

import {
  HORIZONTAL_ORIENTATION,
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
  // required props for a functional interactive SingleDatePicker
  date: null,
  focused: false,
  minDate: null,
  maxDate: null,

  // input related props
  id: 'date',
  placeholder: 'Date',
  ariaLabel: undefined,
  autoComplete: 'off',
  titleText: undefined,
  disabled: false,
  required: false,
  readOnly: false,
  screenReaderInputMessage: '',
  showClearDate: false,
  showDefaultInputIcon: false,
  inputIconPosition: ICON_BEFORE_POSITION,
  customInputIcon: null,
  customCloseIcon: null,
  noBorder: false,
  block: false,
  small: false,
  regular: false,
  verticalSpacing: DEFAULT_VERTICAL_SPACING,
  keepFocusOnInput: false,

  // calendar presentation and interaction related props
  orientation: HORIZONTAL_ORIENTATION,
  anchorDirection: ANCHOR_LEFT,
  openDirection: OPEN_DOWN,
  horizontalMargin: 0,
  withPortal: false,
  withFullScreenPortal: false,
  appendToBody: false,
  disableScroll: false,
  initialVisibleMonth: null,
  firstDayOfWeek: null,
  numberOfMonths: 2,
  keepOpenOnDateSelect: false,
  reopenPickerOnClearDate: false,
  renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  hideKeyboardShortcutsPanel: false,
  daySize: DAY_SIZE,
  isRTL: false,
  verticalHeight: null,
  transitionDuration: undefined,
  horizontalMonthPadding: 13,

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

  // month presentation and interaction related props
  renderMonthText: null,
  renderWeekHeaderElement: null,

  // day presentation and interaction related props
  renderCalendarDay: undefined,
  renderDayContents: null,
  renderMonthElement: null,
  enableOutsideDays: false,
  isDayBlocked: () => false,
  isOutsideRange: (day) => !isInclusivelyAfterDay(day, DateTime.local()),
  isDayHighlighted: () => false,

  // internationalization props
  displayFormat: { dateStyle: 'short' },
  monthFormat: { month: 'long', year: 'numeric' },
  weekDayFormat: { weekday: 'short' },
  phrases: SingleDatePickerPhrases,
  dayAriaLabelFormat: { dateStyle: 'full' },
} satisfies Partial<SingleDatePickerProps>;

type OptionalUndefinedProps = 'ariaLabel'
  | 'titleText'
  | 'transitionDuration'
  | 'renderCalendarDay';
type DefaultedProps = Exclude<keyof typeof defaultProps, OptionalUndefinedProps>;
type SingleDatePickerInternalProps = SingleDatePickerProps
  & WithStylesProps
  & Required<Pick<SingleDatePickerProps, DefaultedProps>>
  & Pick<SingleDatePickerProps, OptionalUndefinedProps>;

interface SingleDatePickerState {
  dayPickerContainerStyles: CSSProperties;
  isDayPickerFocused: boolean;
  isInputFocused: boolean;
  showKeyboardShortcuts: boolean;
}

class SingleDatePicker extends React.PureComponent<SingleDatePickerProps, SingleDatePickerState> {
  static defaultProps = defaultProps;

  declare readonly props: Readonly<SingleDatePickerInternalProps>;

  private isTouchDevice = false;

  private dayPickerContainer: HTMLDivElement | null = null;

  private container: HTMLDivElement | null = null;

  private removeResizeEventListener?: () => void;

  private removeFocusOutEventListener?: () => void;

  private enableScroll?: () => void;

  private restoreFocusOnClose = false;

  private suppressRestoredInputFocus = false;

  constructor(props: SingleDatePickerProps) {
    super(props);

    this.state = {
      dayPickerContainerStyles: {},
      isDayPickerFocused: false,
      isInputFocused: false,
      showKeyboardShortcuts: false,
    };

  }

  /* istanbul ignore next */
  override componentDidMount() {
    // React 18 Strict Mode replays lifecycle cleanup without replaying callback refs.
    this.addEventListeners();
    this.removeResizeEventListener = addEventListener(
      window,
      'resize',
      this.responsivizePickerPosition,
      { passive: true },
    );

    this.responsivizePickerPosition();
    this.disableScroll();

    const { focused } = this.props;

    if (focused) {
      this.setState({
        isInputFocused: true,
      });
    }

    this.isTouchDevice = isTouchDevice();
  }

  override componentDidUpdate(prevProps: SingleDatePickerInternalProps) {
    const { focused } = this.props;
    if (!prevProps.focused && focused) {
      this.responsivizePickerPosition();
      this.disableScroll();
    } else if (prevProps.focused && !focused) {
      if (this.enableScroll) this.enableScroll();
      if (this.restoreFocusOnClose) {
        this.restoreFocusOnClose = false;
        this.suppressRestoredInputFocus = true;
        this.container?.querySelector('input')?.focus();
      }
    }
  }

  /* istanbul ignore next */
  override componentWillUnmount() {
    if (this.removeResizeEventListener) this.removeResizeEventListener();
    if (this.removeFocusOutEventListener) this.removeFocusOutEventListener();
    if (this.enableScroll) this.enableScroll();
  }

  onOutsideClick = (event: Event | ReactMouseEvent<HTMLElement>) => {
    const {
      focused,
      onFocusChange,
      onClose,
      date,
      appendToBody,
    } = this.props;

    if (!focused) return;
    if (appendToBody && event.target instanceof Node
      && this.dayPickerContainer?.contains(event.target)) return;

    this.setState({
      isInputFocused: false,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });

    onFocusChange({ focused: false });
    onClose({ date });
  };

  onInputFocus = ({ focused }: { focused: boolean }) => {
    const {
      onFocusChange,
      readOnly,
      withPortal,
      withFullScreenPortal,
      keepFocusOnInput,
    } = this.props;

    if (focused && this.suppressRestoredInputFocus) {
      this.suppressRestoredInputFocus = false;
      return;
    }

    if (focused) {
      const withAnyPortal = withPortal || withFullScreenPortal;
      const moveFocusToDayPicker = withAnyPortal
        || (readOnly && !keepFocusOnInput)
        || (this.isTouchDevice && !keepFocusOnInput);

      if (moveFocusToDayPicker) {
        this.onDayPickerFocus();
      } else {
        this.onDayPickerBlur();
      }
    } else {
      this.setState({
        isInputFocused: false,
        isDayPickerFocused: false,
        showKeyboardShortcuts: false,
      });
      const input = this.container?.querySelector('input');
      if (typeof document !== 'undefined' && input && input === document.activeElement) input.blur();
    }

    onFocusChange({ focused });
  };

  onDayPickerFocus = () => {
    this.setState({
      isInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: false,
    });
  };

  onDayPickerBlur = () => {
    this.setState({
      isInputFocused: true,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });
  };

  onDayPickerFocusChange = ({ focused }: { focused: boolean }) => {
    if (!focused) {
      this.restoreFocusOnClose = Boolean(
        this.dayPickerContainer?.contains(getActiveElement()),
      );
      if (this.restoreFocusOnClose) {
        this.onDayPickerBlur();
      } else {
        this.setState({
          isInputFocused: false,
          isDayPickerFocused: false,
          showKeyboardShortcuts: false,
        });
      }
    }
    this.props.onFocusChange({ focused });
  };

  onDayPickerEscape = () => {
    const { date, onClose } = this.props;
    this.onDayPickerFocusChange({ focused: false });
    onClose({ date });
  };

  onFocusOut = (event: FocusEvent) => {
    const { onFocusChange } = this.props;
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
    onFocusChange({ focused: false });
  };

  setDayPickerContainerRef = (ref: HTMLDivElement | null) => {
    if (ref === this.dayPickerContainer) return;
    this.removeEventListeners();

    this.dayPickerContainer = ref;
    if (!ref) return;

    this.addEventListeners();
  };

  setContainerRef = (ref: HTMLDivElement | null) => {
    this.container = ref;
  };

  addEventListeners() {
    this.removeEventListeners();
    // We manually set event because React has not implemented onFocusIn/onFocusOut.
    // Keep an eye on https://github.com/facebook/react/issues/6410 for updates
    // We use "blur w/ useCapture param" vs "onfocusout" for FF browser support
    this.removeFocusOutEventListener = addEventListener(
      this.dayPickerContainer,
      'focusout',
      this.onFocusOut,
    );
  }

  removeEventListeners() {
    if (this.removeFocusOutEventListener) this.removeFocusOutEventListener();
  }

  disableScroll = () => {
    const { appendToBody, disableScroll: propDisableScroll, focused } = this.props;
    if (!appendToBody && !propDisableScroll) return;
    if (!focused) return;

    this.enableScroll = lockScroll();
  };

  /* istanbul ignore next */
  responsivizePickerPosition = () => {
    // It's possible the portal props have been changed in response to window resizes
    // So let's ensure we reset this back to the base state each time
    this.setState({ dayPickerContainerStyles: {} });

    const {
      openDirection,
      anchorDirection,
      horizontalMargin,
      withPortal,
      withFullScreenPortal,
      appendToBody,
      focused,
    } = this.props;

    const { dayPickerContainerStyles } = this.state;

    if (!focused) {
      return;
    }

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
      isInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: true,
    });
  };

  maybeRenderDayPickerWithPortal() {
    const {
      focused,
      withPortal,
      withFullScreenPortal,
      appendToBody,
    } = this.props;

    if (!focused) {
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
      onDateChange,
      date,
      minDate,
      maxDate,
      focused,
      enableOutsideDays,
      numberOfMonths,
      orientation,
      monthFormat,
      dayPickerNavigationInlineStyles,
      navPosition,
      navPrev,
      navNext,
      renderNavPrevButton,
      renderNavNextButton,
      onPrevMonthClick,
      onNextMonthClick,
      onClose,
      withPortal,
      withFullScreenPortal,
      keepOpenOnDateSelect,
      initialVisibleMonth,
      renderMonthText,
      renderWeekHeaderElement,
      renderCalendarDay,
      renderDayContents,
      renderCalendarInfo,
      renderMonthElement,
      calendarInfoPosition,
      hideKeyboardShortcutsPanel,
      firstDayOfWeek,
      customCloseIcon,
      phrases,
      dayAriaLabelFormat,
      daySize,
      isRTL,
      isOutsideRange,
      isDayBlocked,
      isDayHighlighted,
      weekDayFormat,
      css,
      styles,
      verticalHeight,
      noBorder,
      transitionDuration,
      verticalSpacing,
      horizontalMonthPadding,
      small,
      theme: { reactDates },
    } = this.props;
    const { dayPickerContainerStyles, isDayPickerFocused, showKeyboardShortcuts } = this.state;

    const onOutsideClick = (!withFullScreenPortal && withPortal) ? this.onOutsideClick : undefined;
    const closeIcon = customCloseIcon || (<CloseButton />);

    const inputHeight = getInputHeight(reactDates, small);

    const withAnyPortal = withPortal || withFullScreenPortal;

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    return (
      <div
        ref={this.setDayPickerContainerRef}
        {...css(
          styles.SingleDatePicker_picker,
          !noBorder && styles.SingleDatePicker_picker__withBorder,
          anchorDirection === ANCHOR_LEFT && styles.SingleDatePicker_picker__directionLeft,
          anchorDirection === ANCHOR_RIGHT && styles.SingleDatePicker_picker__directionRight,
          !withAnyPortal && openDirection === OPEN_DOWN && {
            top: inputHeight + verticalSpacing,
          },
          !withAnyPortal && openDirection === OPEN_UP && {
            bottom: inputHeight + verticalSpacing,
          },
          withAnyPortal && styles.SingleDatePicker_picker__portal,
          withFullScreenPortal && styles.SingleDatePicker_picker__fullScreenPortal,
          isRTL && styles.SingleDatePicker_picker__rtl,
          dayPickerContainerStyles,
        )}
        onClick={onOutsideClick}
      >
        <DayPickerSingleDateController
          {...(renderMonthText
            ? { renderMonthText, renderMonthElement: null }
            : { renderMonthText: null, renderMonthElement })}
          date={date}
          minDate={minDate}
          maxDate={maxDate}
          onDateChange={onDateChange}
          onFocusChange={this.onDayPickerFocusChange}
          orientation={orientation}
          enableOutsideDays={enableOutsideDays}
          numberOfMonths={numberOfMonths}
          monthFormat={monthFormat}
          withPortal={withAnyPortal}
          focused={focused}
          keepOpenOnDateSelect={keepOpenOnDateSelect}
          hideKeyboardShortcutsPanel={hideKeyboardShortcutsPanel}
          initialVisibleMonth={initialVisibleMonth}
          dayPickerNavigationInlineStyles={dayPickerNavigationInlineStyles}
          navPosition={navPosition}
          navPrev={navPrev}
          navNext={navNext}
          renderNavPrevButton={renderNavPrevButton}
          renderNavNextButton={renderNavNextButton}
          onPrevMonthClick={onPrevMonthClick}
          onNextMonthClick={onNextMonthClick}
          onClose={onClose}
          renderWeekHeaderElement={renderWeekHeaderElement}
          renderCalendarDay={renderCalendarDay}
          renderDayContents={renderDayContents}
          renderCalendarInfo={renderCalendarInfo}
          calendarInfoPosition={calendarInfoPosition}
          isFocused={isDayPickerFocused}
          showKeyboardShortcuts={showKeyboardShortcuts}
          onBlur={this.onDayPickerEscape}
          phrases={phrases}
          dayAriaLabelFormat={dayAriaLabelFormat}
          daySize={daySize}
          isRTL={isRTL}
          isOutsideRange={isOutsideRange}
          isDayBlocked={isDayBlocked}
          isDayHighlighted={isDayHighlighted}
          firstDayOfWeek={firstDayOfWeek}
          weekDayFormat={weekDayFormat}
          verticalHeight={verticalHeight}
          transitionDuration={transitionDuration}
          horizontalMonthPadding={horizontalMonthPadding}
        />

        {withFullScreenPortal && (
          <button
            {...css(styles.SingleDatePicker_closeButton)}
            aria-label={phrases.closeDatePicker}
            type="button"
            onClick={this.onOutsideClick}
          >
            <div {...css(styles.SingleDatePicker_closeButton_svg)}>
              {closeIcon}
            </div>
          </button>
        )}
      </div>
    );
    /* eslint-enable jsx-a11y/no-static-element-interactions */
    /* eslint-enable jsx-a11y/click-events-have-key-events */
  }

  override render() {
    const {
      id,
      placeholder,
      ariaLabel,
      autoComplete,
      titleText,
      disabled,
      focused,
      required,
      readOnly,
      openDirection,
      showClearDate,
      showDefaultInputIcon,
      inputIconPosition,
      customCloseIcon,
      customInputIcon,
      date,
      onDateChange,
      displayFormat,
      phrases,
      withPortal,
      withFullScreenPortal,
      screenReaderInputMessage,
      isRTL,
      noBorder,
      block,
      small,
      regular,
      verticalSpacing,
      reopenPickerOnClearDate,
      keepOpenOnDateSelect,
      css,
      styles,
      isOutsideRange,
      isDayBlocked,
    } = this.props;

    const { isInputFocused } = this.state;

    const enableOutsideClick = (!withPortal && !withFullScreenPortal);

    const hideFang = verticalSpacing < FANG_HEIGHT_PX;

    const input = (
      <SingleDatePickerInputController
        id={id}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        autoComplete={autoComplete}
        titleText={titleText}
        focused={focused}
        isFocused={isInputFocused}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        openDirection={openDirection}
        showCaret={!withPortal && !withFullScreenPortal && !hideFang}
        showClearDate={showClearDate}
        showDefaultInputIcon={showDefaultInputIcon}
        inputIconPosition={inputIconPosition}
        isOutsideRange={isOutsideRange}
        isDayBlocked={isDayBlocked}
        customCloseIcon={customCloseIcon}
        customInputIcon={customInputIcon}
        date={date}
        onDateChange={onDateChange}
        displayFormat={displayFormat}
        onFocusChange={this.onInputFocus}
        onKeyDownArrowDown={this.onDayPickerFocus}
        onKeyDownQuestionMark={this.showKeyboardShortcutsPanel}
        screenReaderMessage={screenReaderInputMessage}
        phrases={phrases}
        isRTL={isRTL}
        noBorder={noBorder}
        block={block}
        small={small}
        regular={regular}
        verticalSpacing={verticalSpacing}
        reopenPickerOnClearDate={reopenPickerOnClearDate}
        keepOpenOnDateSelect={keepOpenOnDateSelect}
      >
        {this.maybeRenderDayPickerWithPortal()}
      </SingleDatePickerInputController>
    );

    return (
      <div
        ref={this.setContainerRef}
        {...css(
          styles.SingleDatePicker,
          block && styles.SingleDatePicker__block,
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

export { SingleDatePicker as PureSingleDatePicker };
export default withStyles(({ reactDates: { color, zIndex } }) => ({
  SingleDatePicker: {
    position: 'relative',
    display: 'inline-block',
  },

  SingleDatePicker__block: {
    display: 'block',
  },

  SingleDatePicker_picker: {
    zIndex: zIndex + 1,
    backgroundColor: color.background,
    position: 'absolute',
    overflowX: 'hidden',
  },

  SingleDatePicker_picker__withBorder: {
    boxShadow: noflip('0 2px 6px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.07)'),
    borderRadius: 3,
  },

  SingleDatePicker_picker__rtl: {
    direction: noflip('rtl'),
  },

  SingleDatePicker_picker__directionLeft: {
    left: noflip(0),
  },

  SingleDatePicker_picker__directionRight: {
    right: noflip(0),
  },

  SingleDatePicker_picker__portal: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'fixed',
    top: 0,
    left: noflip(0),
    height: '100%',
    width: '100%',
  },

  SingleDatePicker_picker__fullScreenPortal: {
    backgroundColor: color.background,
  },

  SingleDatePicker_closeButton: {
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

  SingleDatePicker_closeButton_svg: {
    height: 15,
    width: 15,
    fill: color.core.grayLighter,
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })<
SingleDatePickerInternalProps,
SingleDatePickerProps
>(SingleDatePicker);
