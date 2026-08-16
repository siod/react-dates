/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react';
import noop from '../utils/noop';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from '../internal/propTypes';
import {
  endOfWeek,
  getFirstDayOfWeek as getLocaleFirstDayOfWeek,
  getWeekdayLabels,
  startOfWeek,
} from '../internal/date';
import { isTouchDevice } from '../internal/browser/touch';
import throttle from '../internal/browser/throttle';
import { getActiveElement } from '../internal/browser/activeElement';
import { withStyles, withStylesPropTypes } from '../internal/styles';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import getCalendarMonthWeeks from '../utils/getCalendarMonthWeeks';
import isDateTime from '../utils/isDateTime';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth';
import calculateDimension from '../utils/calculateDimension';
import isDayVisible from '../utils/isDayVisible';

import CalendarMonthGrid from './CalendarMonthGrid';
import DayPickerNavigation from './DayPickerNavigation';
import DayPickerKeyboardShortcuts, {
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_RIGHT,
} from './DayPickerKeyboardShortcuts';
import OutsideClickHandler from '../internal/browser/outsideClick.jsx';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
  DEFAULT_MONTH_FORMAT,
  DEFAULT_WEEKDAY_FORMAT,
  DEFAULT_DAY_ARIA_FORMAT,
  INFO_POSITION_TOP,
  INFO_POSITION_BOTTOM,
  INFO_POSITION_BEFORE,
  INFO_POSITION_AFTER,
  MODIFIER_KEY_NAMES,
  NAV_POSITION_TOP,
  NAV_POSITION_BOTTOM,
} from '../constants';

const MONTH_PADDING = 23;
const PREV_TRANSITION = 'prev';
const NEXT_TRANSITION = 'next';
const MONTH_SELECTION_TRANSITION = 'month_selection';
const YEAR_SELECTION_TRANSITION = 'year_selection';
const PREV_NAV = 'prev_nav';
const NEXT_NAV = 'next_nav';

const dateFormatProp = PropTypes.oneOfType([PropTypes.object, PropTypes.func]);
const styleKeys = [
  'DayPicker',
  'DayPicker__horizontal',
  'DayPicker__verticalScrollable',
  'DayPicker_portal__horizontal',
  'DayPicker_portal__vertical',
  'DayPicker__hidden',
  'DayPicker__withBorder',
  'DayPicker_calendarInfo__horizontal',
  'DayPicker_wrapper__horizontal',
  'DayPicker_weekHeaders',
  'DayPicker_weekHeaders__horizontal',
  'DayPicker_focusRegion',
  'DayPicker_transitionContainer',
  'DayPicker_transitionContainer__horizontal',
  'DayPicker_transitionContainer__vertical',
  'DayPicker_transitionContainer__verticalScrollable',
  'DayPicker_weekHeader',
  'DayPicker_weekHeader__vertical',
  'DayPicker_weekHeader__verticalScrollable',
  'DayPicker_weekHeader_ul',
  'DayPicker_weekHeader_li',
];
const staticStyles = () => styleKeys.reduce((result, key) => ({ ...result, [key]: {} }), {});

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: PropTypes.string,
  withPortal: PropTypes.bool,
  onOutsideClick: PropTypes.func,
  hidden: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  firstDayOfWeek: PropTypes.number,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: PropTypes.string,
  hideKeyboardShortcutsPanel: PropTypes.bool,
  daySize: nonNegativeInteger,
  isRTL: PropTypes.bool,
  verticalHeight: nonNegativeInteger,
  noBorder: PropTypes.bool,
  transitionDuration: nonNegativeInteger,
  verticalBorderSpacing: nonNegativeInteger,
  horizontalMonthPadding: nonNegativeInteger,
  renderKeyboardShortcutsButton: PropTypes.func,
  renderKeyboardShortcutsPanel: PropTypes.func,
  dayPickerNavigationInlineStyles: PropTypes.object,
  disablePrev: PropTypes.bool,
  disableNext: PropTypes.bool,
  navPosition: PropTypes.string,
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  renderNavPrevButton: PropTypes.func,
  renderNavNextButton: PropTypes.func,
  noNavButtons: PropTypes.bool,
  noNavNextButton: PropTypes.bool,
  noNavPrevButton: PropTypes.bool,
  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  onMonthChange: PropTypes.func,
  onYearChange: PropTypes.func,
  onGetNextScrollableMonths: PropTypes.func,
  onGetPrevScrollableMonths: PropTypes.func,
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderWeekHeaderElement: PropTypes.func,
  modifiers: PropTypes.object,
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,
  isFocused: PropTypes.bool,
  getFirstFocusableDay: PropTypes.func,
  onBlur: PropTypes.func,
  showKeyboardShortcuts: PropTypes.bool,
  onTab: PropTypes.func,
  onShiftTab: PropTypes.func,
  monthFormat: dateFormatProp,
  weekDayFormat: dateFormatProp,
  dayAriaLabelFormat: dateFormatProp,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),
});

const defaultProps = {
  enableOutsideDays: false,
  numberOfMonths: 2,
  orientation: HORIZONTAL_ORIENTATION,
  withPortal: false,
  onOutsideClick: noop,
  hidden: false,
  initialVisibleMonth: () => DateTime.local(),
  firstDayOfWeek: null,
  renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM,
  hideKeyboardShortcutsPanel: false,
  daySize: DAY_SIZE,
  isRTL: false,
  verticalHeight: null,
  noBorder: false,
  transitionDuration: 200,
  verticalBorderSpacing: undefined,
  horizontalMonthPadding: 13,
  renderKeyboardShortcutsButton: undefined,
  renderKeyboardShortcutsPanel: undefined,
  dayPickerNavigationInlineStyles: null,
  disablePrev: false,
  disableNext: false,
  navPosition: NAV_POSITION_TOP,
  navPrev: null,
  navNext: null,
  renderNavPrevButton: null,
  renderNavNextButton: null,
  noNavButtons: false,
  noNavNextButton: false,
  noNavPrevButton: false,
  onPrevMonthClick: noop,
  onNextMonthClick: noop,
  onMonthChange: noop,
  onYearChange: noop,
  onGetNextScrollableMonths: noop,
  onGetPrevScrollableMonths: noop,
  renderMonthText: null,
  renderMonthElement: null,
  renderWeekHeaderElement: null,
  modifiers: {},
  renderCalendarDay: undefined,
  renderDayContents: null,
  onDayClick: noop,
  onDayMouseEnter: noop,
  onDayMouseLeave: noop,
  isFocused: false,
  getFirstFocusableDay: null,
  onBlur: noop,
  showKeyboardShortcuts: false,
  onTab: noop,
  onShiftTab: noop,
  monthFormat: DEFAULT_MONTH_FORMAT,
  weekDayFormat: DEFAULT_WEEKDAY_FORMAT,
  dayAriaLabelFormat: DEFAULT_DAY_ARIA_FORMAT,
  phrases: DayPickerPhrases,
};

class DayPicker extends React.PureComponent {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    const initialMonth = props.hidden ? DateTime.local() : props.initialVisibleMonth();
    const currentMonth = isDateTime(initialMonth)
      ? initialMonth.startOf('month')
      : DateTime.local().startOf('month');
    const calendarMonthWidth = getCalendarMonthWidth(
      props.daySize,
      props.horizontalMonthPadding,
    );
    const focusedDate = this.getFocusedDay(currentMonth, props);

    this.state = {
      currentMonth,
      currentMonthScrollTop: null,
      focusedDate: (!props.hidden || props.isFocused) ? focusedDate : null,
      nextFocusedDate: null,
      monthTransition: null,
      translationValue: props.isRTL && props.orientation === HORIZONTAL_ORIENTATION
        ? -calendarMonthWidth
        : 0,
      scrollableMonthMultiple: 1,
      calendarMonthWidth,
      showKeyboardShortcuts: props.showKeyboardShortcuts,
      onKeyboardShortcutsPanelClose: null,
      isTouchDevice: isTouchDevice(),
      withMouseInteractions: true,
      calendarInfoWidth: 0,
      monthTitleHeight: null,
      hasSetHeight: false,
    };

    this.calendarMonthGridHeight = 0;
    this.calendarMonthWeeks = [];
    this.setCalendarMonthWeeks(currentMonth);
    this.throttledKeyDown = throttle((event) => this.onFinalKeyDown(event), 200, {
      trailing: false,
    });

    [
      'onKeyDown',
      'onFinalKeyDown',
      'onPrevMonthClick',
      'onPrevMonthTransition',
      'onNextMonthClick',
      'onNextMonthTransition',
      'onMonthChange',
      'onYearChange',
      'getNextScrollableMonths',
      'getPrevScrollableMonths',
      'updateStateAfterMonthTransition',
      'openKeyboardShortcutsPanel',
      'closeKeyboardShortcutsPanel',
      'setContainerRef',
      'setTransitionContainerRef',
      'setCalendarInfoRef',
      'setMonthTitleHeight',
    ].forEach((name) => { this[name] = this[name].bind(this); });
  }

  componentDidMount() {
    const calendarInfoWidth = this.calendarInfo
      ? calculateDimension(this.calendarInfo, 'width', true, true)
      : 0;
    const currentMonthScrollTop = this.transitionContainer
      && this.props.orientation === VERTICAL_SCROLLABLE
      ? this.transitionContainer.scrollHeight - this.transitionContainer.scrollTop
      : null;
    this.setState({
      isTouchDevice: isTouchDevice(),
      calendarInfoWidth,
      currentMonthScrollTop,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      daySize,
      horizontalMonthPadding,
      isFocused,
      numberOfMonths,
      orientation,
      showKeyboardShortcuts,
    } = this.props;
    const { currentMonth, focusedDate, monthTitleHeight } = this.state;

    if (!this.props.hidden) {
      const requestedMonth = this.props.initialVisibleMonth?.();
      const previousRequestedMonth = prevProps.initialVisibleMonth?.();
      const requestedMonthChanged = isDateTime(requestedMonth)
        && (!isDateTime(previousRequestedMonth)
          || !requestedMonth.hasSame(previousRequestedMonth, 'month'));
      if ((prevProps.hidden || requestedMonthChanged)
        && isDateTime(requestedMonth)
        && !isDayVisible(requestedMonth, currentMonth, numberOfMonths)) {
        const nextMonth = requestedMonth.startOf('month');
        this.setCalendarMonthWeeks(nextMonth);
        this.setState({
          currentMonth: nextMonth,
          focusedDate: this.getFocusedDay(nextMonth),
        });
      }
    }

    if (prevProps.daySize !== daySize
      || prevProps.horizontalMonthPadding !== horizontalMonthPadding) {
      this.setState({
        calendarMonthWidth: getCalendarMonthWidth(daySize, horizontalMonthPadding),
      });
    }

    if (prevProps.isFocused !== isFocused) {
      if (isFocused) {
        this.setState({
          focusedDate: focusedDate || this.getFocusedDay(currentMonth),
          showKeyboardShortcuts,
          withMouseInteractions: false,
        });
      } else if (focusedDate) {
        this.setState({ focusedDate: null });
      }
    }

    const layoutChanged = prevProps.numberOfMonths !== numberOfMonths
      || prevProps.orientation !== orientation
      || prevProps.daySize !== daySize
      || prevProps.firstDayOfWeek !== this.props.firstDayOfWeek;
    if (layoutChanged) {
      this.setCalendarMonthWeeks(currentMonth);
      if (monthTitleHeight != null) this.calculateAndSetDayPickerHeight();
    }

    if (orientation === VERTICAL_SCROLLABLE
      && !prevState.currentMonth.hasSame(currentMonth, 'month')
      && this.state.currentMonthScrollTop
      && this.transitionContainer) {
      this.transitionContainer.scrollTop = this.transitionContainer.scrollHeight
        - this.state.currentMonthScrollTop;
    }

    if (!prevProps.isFocused && isFocused && !this.state.focusedDate) {
      this.container?.focus();
    }
  }

  componentWillUnmount() {
    this.throttledKeyDown.cancel();
    clearTimeout(this.setCalendarInfoWidthTimeout);
    clearTimeout(this.setCalendarMonthGridHeightTimeout);
  }

  isHorizontal() {
    return this.props.orientation === HORIZONTAL_ORIENTATION;
  }

  isVertical() {
    return this.props.orientation === VERTICAL_ORIENTATION
      || this.props.orientation === VERTICAL_SCROLLABLE;
  }

  getFirstDayOfWeek() {
    return this.props.firstDayOfWeek == null
      ? getLocaleFirstDayOfWeek({ locale: this.state?.currentMonth?.locale })
      : this.props.firstDayOfWeek;
  }

  getWeekHeaders() {
    const format = this.props.weekDayFormat;
    return getWeekdayLabels({
      ...(typeof format === 'object' && format ? format : {}),
      locale: this.state.currentMonth.locale,
      firstDayOfWeek: this.getFirstDayOfWeek(),
    }, typeof format === 'function' ? format : null);
  }

  getFocusedDay(month, props = this.props) {
    const candidate = props.getFirstFocusableDay?.(month) || month.startOf('month');
    if (isDateTime(candidate) && isDayVisible(candidate, month, props.numberOfMonths)) {
      return candidate;
    }
    return month.startOf('month');
  }

  getFirstVisibleIndex() {
    if (this.props.orientation === VERTICAL_SCROLLABLE) return 0;
    if (this.state.monthTransition === PREV_TRANSITION) return 0;
    if (this.state.monthTransition === NEXT_TRANSITION) return 2;
    return 1;
  }

  setCalendarMonthWeeks(month) {
    this.calendarMonthWeeks = [];
    let current = month.minus({ months: 1 });
    const firstDayOfWeek = this.getFirstDayOfWeek();
    for (let index = 0; index < this.props.numberOfMonths + 2; index += 1) {
      this.calendarMonthWeeks.push(getCalendarMonthWeeks(current, {
        firstDayOfWeek,
        enableOutsideDays: true,
      }).length);
      current = current.plus({ months: 1 });
    }
  }

  setContainerRef(ref) {
    this.container = ref;
  }

  setTransitionContainerRef(ref) {
    this.transitionContainer = ref;
  }

  setCalendarInfoRef(ref) {
    this.calendarInfo = ref;
  }

  setMonthTitleHeight(monthTitleHeight) {
    this.setState({ monthTitleHeight }, () => this.calculateAndSetDayPickerHeight());
  }

  onKeyDown(event) {
    event.stopPropagation();
    if (!MODIFIER_KEY_NAMES.has(event.key)) this.throttledKeyDown(event);
  }

  onFinalKeyDown(event) {
    const { focusedDate, showKeyboardShortcuts } = this.state;
    if (!focusedDate) return;

    let next = focusedDate;
    let direction = null;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        next = next.minus({ days: 7 });
        direction = PREV_TRANSITION;
        break;
      case 'ArrowDown':
        event.preventDefault();
        next = next.plus({ days: 7 });
        direction = NEXT_TRANSITION;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        next = next.plus({ days: this.props.isRTL ? 1 : -1 });
        direction = this.props.isRTL ? NEXT_TRANSITION : PREV_TRANSITION;
        break;
      case 'ArrowRight':
        event.preventDefault();
        next = next.plus({ days: this.props.isRTL ? -1 : 1 });
        direction = this.props.isRTL ? PREV_TRANSITION : NEXT_TRANSITION;
        break;
      case 'Home':
        event.preventDefault();
        next = startOfWeek(next, { firstDayOfWeek: this.getFirstDayOfWeek() });
        direction = PREV_TRANSITION;
        break;
      case 'End':
        event.preventDefault();
        next = endOfWeek(next, { firstDayOfWeek: this.getFirstDayOfWeek() });
        direction = NEXT_TRANSITION;
        break;
      case 'PageUp':
        event.preventDefault();
        next = next.minus({ months: 1 });
        direction = PREV_TRANSITION;
        break;
      case 'PageDown':
        event.preventDefault();
        next = next.plus({ months: 1 });
        direction = NEXT_TRANSITION;
        break;
      case '?': {
        const activeElement = getActiveElement();
        this.openKeyboardShortcutsPanel(() => activeElement?.focus());
        return;
      }
      case 'Escape':
        if (showKeyboardShortcuts) this.closeKeyboardShortcutsPanel();
        else this.props.onBlur(event);
        return;
      case 'Tab':
        if (event.shiftKey) this.props.onShiftTab();
        else this.props.onTab(event);
        return;
      default:
        return;
    }

    this.setState({ withMouseInteractions: false });
    const changedMonth = !next.hasSame(focusedDate, 'month');
    const remainsVisible = isDayVisible(
      next,
      this.state.currentMonth,
      this.props.numberOfMonths,
    );
    if (changedMonth && !remainsVisible) {
      if (direction === PREV_TRANSITION) this.onPrevMonthTransition(next);
      else this.onNextMonthTransition(next);
    } else {
      this.setState({ focusedDate: next });
    }
  }

  onPrevMonthClick(event) {
    event?.preventDefault();
    this.onPrevMonthTransition();
  }

  onNextMonthClick(event) {
    event?.preventDefault();
    this.onNextMonthTransition();
  }

  onPrevMonthTransition(nextFocusedDate = null) {
    const { calendarMonthWidth, monthTitleHeight } = this.state;
    let translationValue = calendarMonthWidth;
    if (this.isVertical()) {
      translationValue = (monthTitleHeight || 0)
        + this.calendarMonthWeeks[0] * (this.props.daySize - 1)
        + 1;
    } else if (this.props.isRTL) {
      translationValue = -2 * calendarMonthWidth;
    }
    this.adjustHeightForWeeks(this.calendarMonthWeeks.slice(0, this.props.numberOfMonths));
    this.setState({
      monthTransition: PREV_TRANSITION,
      translationValue,
      focusedDate: null,
      nextFocusedDate,
    });
  }

  onNextMonthTransition(nextFocusedDate = null) {
    const { calendarMonthWidth, monthTitleHeight } = this.state;
    let translationValue = -calendarMonthWidth;
    if (this.isVertical()) {
      translationValue = -((monthTitleHeight || 0)
        + this.calendarMonthWeeks[1] * (this.props.daySize - 1)
        + 1);
    } else if (this.props.isRTL) {
      translationValue = 0;
    }
    this.adjustHeightForWeeks(this.calendarMonthWeeks.slice(2, this.props.numberOfMonths + 2));
    this.setState({
      monthTransition: NEXT_TRANSITION,
      translationValue,
      focusedDate: null,
      nextFocusedDate,
    });
  }

  onMonthChange(month) {
    const currentMonth = month.startOf('month');
    this.setCalendarMonthWeeks(currentMonth);
    this.setState({
      currentMonth,
      monthTransition: MONTH_SELECTION_TRANSITION,
      translationValue: 0.00001,
      focusedDate: null,
      nextFocusedDate: month,
    });
  }

  onYearChange(month) {
    const currentMonth = month.startOf('month');
    this.setCalendarMonthWeeks(currentMonth);
    this.setState({
      currentMonth,
      monthTransition: YEAR_SELECTION_TRANSITION,
      translationValue: 0.0001,
      focusedDate: null,
      nextFocusedDate: month,
    });
  }

  updateStateAfterMonthTransition() {
    const {
      currentMonth,
      monthTransition,
      nextFocusedDate,
      withMouseInteractions,
      calendarMonthWidth,
    } = this.state;
    if (!monthTransition) return;

    let newMonth = currentMonth;
    if (monthTransition === PREV_TRANSITION) {
      newMonth = currentMonth.minus({ months: 1 });
      this.props.onPrevMonthClick(newMonth);
    } else if (monthTransition === NEXT_TRANSITION) {
      newMonth = currentMonth.plus({ months: 1 });
      this.props.onNextMonthClick(newMonth);
    } else if (monthTransition === MONTH_SELECTION_TRANSITION) {
      this.props.onMonthChange(newMonth);
    } else if (monthTransition === YEAR_SELECTION_TRANSITION) {
      this.props.onYearChange(newMonth);
    }

    this.setCalendarMonthWeeks(newMonth);
    const focusedDate = nextFocusedDate
      || (!withMouseInteractions ? this.getFocusedDay(newMonth) : null);
    this.setState({
      currentMonth: newMonth,
      monthTransition: null,
      translationValue: this.props.isRTL && this.isHorizontal() ? -calendarMonthWidth : 0,
      nextFocusedDate: null,
      focusedDate,
    }, () => {
      this.calculateAndSetDayPickerHeight();
      if (withMouseInteractions) {
        const activeElement = getActiveElement();
        if (activeElement && activeElement !== document.body
          && this.container?.contains(activeElement)) activeElement.blur();
      }
    });
  }

  adjustHeightForWeeks(weeks) {
    if (!this.isHorizontal() || this.state.monthTitleHeight == null) return;
    const weeksHeight = Math.max(0, ...weeks) * (this.props.daySize - 1);
    this.adjustDayPickerHeight(this.state.monthTitleHeight + weeksHeight + 1);
  }

  adjustDayPickerHeight(newMonthHeight) {
    if (!this.transitionContainer) return;
    const monthHeight = newMonthHeight + MONTH_PADDING;
    if (monthHeight === this.calendarMonthGridHeight) return;
    this.transitionContainer.style.height = `${monthHeight}px`;
    if (!this.calendarMonthGridHeight) {
      this.setCalendarMonthGridHeightTimeout = setTimeout(() => {
        this.setState({ hasSetHeight: true });
      }, 0);
    }
    this.calendarMonthGridHeight = monthHeight;
  }

  calculateAndSetDayPickerHeight() {
    if (!this.isHorizontal() || this.state.monthTitleHeight == null) return;
    this.adjustHeightForWeeks(
      this.calendarMonthWeeks.slice(1, this.props.numberOfMonths + 1),
    );
  }

  getNextScrollableMonths(event) {
    event?.preventDefault();
    this.props.onGetNextScrollableMonths(event);
    this.setState(({ scrollableMonthMultiple }) => ({
      scrollableMonthMultiple: scrollableMonthMultiple + 1,
    }));
  }

  getPrevScrollableMonths(event) {
    event?.preventDefault();
    this.props.onGetPrevScrollableMonths(event);
    this.setState(({ currentMonth, scrollableMonthMultiple }) => ({
      currentMonth: currentMonth.minus({ months: this.props.numberOfMonths }),
      scrollableMonthMultiple: scrollableMonthMultiple + 1,
    }));
  }

  openKeyboardShortcutsPanel(onClose) {
    this.setState({
      showKeyboardShortcuts: true,
      onKeyboardShortcutsPanelClose: onClose,
    });
  }

  closeKeyboardShortcutsPanel() {
    this.state.onKeyboardShortcutsPanelClose?.();
    this.setState({
      showKeyboardShortcuts: false,
      onKeyboardShortcutsPanelClose: null,
    });
  }

  renderNavigation(direction) {
    const p = this.props;
    if (p.noNavButtons) return null;
    const verticalScrollable = p.orientation === VERTICAL_SCROLLABLE;
    return (
      <DayPickerNavigation
        disablePrev={p.disablePrev}
        disableNext={p.disableNext}
        inlineStyles={p.dayPickerNavigationInlineStyles}
        isRTL={p.isRTL}
        navPosition={p.navPosition}
        navPrev={p.navPrev}
        navNext={p.navNext}
        orientation={p.orientation}
        onPrevMonthClick={verticalScrollable ? this.getPrevScrollableMonths : this.onPrevMonthClick}
        onNextMonthClick={verticalScrollable ? this.getNextScrollableMonths : this.onNextMonthClick}
        phrases={p.phrases}
        renderNavPrevButton={p.renderNavPrevButton}
        renderNavNextButton={p.renderNavNextButton}
        showNavPrevButton={!p.noNavPrevButton && direction !== NEXT_NAV}
        showNavNextButton={!p.noNavNextButton && direction !== PREV_NAV}
      />
    );
  }

  renderWeekHeader(index) {
    const p = this.props;
    const verticalScrollable = p.orientation === VERTICAL_SCROLLABLE;
    let position = {};
    if (this.isHorizontal()) {
      position = { left: index * this.state.calendarMonthWidth };
    } else if (!verticalScrollable) {
      position = { marginLeft: -this.state.calendarMonthWidth / 2 };
    }
    return (
      <div
        {...p.css(
          p.styles.DayPicker_weekHeader,
          this.isVertical() && p.styles.DayPicker_weekHeader__vertical,
          verticalScrollable && p.styles.DayPicker_weekHeader__verticalScrollable,
          position,
          { padding: `0 ${p.horizontalMonthPadding}px` },
        )}
        key={`week-${index}`}
      >
        <ul {...p.css(p.styles.DayPicker_weekHeader_ul)}>
          {this.getWeekHeaders().map((day, dayIndex) => (
            <li
              key={`${dayIndex}-${day}`}
              {...p.css(p.styles.DayPicker_weekHeader_li, { width: p.daySize })}
            >
              {p.renderWeekHeaderElement ? p.renderWeekHeaderElement(day) : <small>{day}</small>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  render() {
    const p = this.props;
    const s = this.state;
    const isHorizontal = this.isHorizontal();
    const verticalScrollable = p.orientation === VERTICAL_SCROLLABLE;
    const isAnimating = s.monthTransition !== null;
    const shouldFocusDate = !isAnimating && p.isFocused;
    const weekHeaders = Array.from(
      { length: this.isVertical() ? 1 : p.numberOfMonths },
      (_, index) => this.renderWeekHeader(index),
    );

    const calendarInfoBefore = p.calendarInfoPosition === INFO_POSITION_TOP
      || p.calendarInfoPosition === INFO_POSITION_BEFORE;
    const calendarInfoAfter = p.calendarInfoPosition === INFO_POSITION_BOTTOM
      || p.calendarInfoPosition === INFO_POSITION_AFTER;
    const calendarInfoInline = p.calendarInfoPosition === INFO_POSITION_BEFORE
      || p.calendarInfoPosition === INFO_POSITION_AFTER;
    const calendarInfo = p.renderCalendarInfo && (
      <div
        ref={this.setCalendarInfoRef}
        {...p.css(calendarInfoInline && p.styles.DayPicker_calendarInfo__horizontal)}
      >
        {p.renderCalendarInfo()}
      </div>
    );

    const horizontalPadding = p.theme.reactDates.spacing.dayPickerHorizontalPadding;
    const wrapperWidth = isHorizontal
      ? s.calendarMonthWidth * p.numberOfMonths + 2 * horizontalPadding
      : undefined;
    const calendarInfoWidth = calendarInfoInline ? s.calendarInfoWidth : 0;
    const fullWidth = isHorizontal ? wrapperWidth + calendarInfoWidth + 1 : undefined;
    let height;
    if (isHorizontal) height = this.calendarMonthGridHeight || undefined;
    else if (!verticalScrollable && !p.withPortal) {
      height = p.verticalHeight || 1.75 * s.calendarMonthWidth;
    }

    const keyboardButtonLocation = this.isVertical()
      ? (p.withPortal ? TOP_LEFT : TOP_RIGHT)
      : BOTTOM_RIGHT;

    return (
      <div
        dir={p.isRTL ? 'rtl' : 'ltr'}
        {...p.css(
          p.styles.DayPicker,
          isHorizontal && p.styles.DayPicker__horizontal,
          verticalScrollable && p.styles.DayPicker__verticalScrollable,
          isHorizontal && p.withPortal && p.styles.DayPicker_portal__horizontal,
          this.isVertical() && p.withPortal && p.styles.DayPicker_portal__vertical,
          {
            width: fullWidth,
            marginLeft: isHorizontal && p.withPortal ? -fullWidth / 2 : undefined,
            marginTop: isHorizontal && p.withPortal ? -s.calendarMonthWidth / 2 : undefined,
          },
          !s.monthTitleHeight && p.styles.DayPicker__hidden,
          !p.noBorder && p.styles.DayPicker__withBorder,
        )}
      >
        <OutsideClickHandler onOutsideClick={p.onOutsideClick}>
          {calendarInfoBefore && calendarInfo}
          <div
            {...p.css(
              { width: wrapperWidth },
              calendarInfoInline && isHorizontal && p.styles.DayPicker_wrapper__horizontal,
            )}
          >
            <div
              {...p.css(
                p.styles.DayPicker_weekHeaders,
                isHorizontal && p.styles.DayPicker_weekHeaders__horizontal,
              )}
              aria-hidden="true"
              role="presentation"
            >
              {weekHeaders}
            </div>
            <div
              {...p.css(p.styles.DayPicker_focusRegion)}
              ref={this.setContainerRef}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={this.onKeyDown}
              onMouseUp={() => this.setState({ withMouseInteractions: true })}
              tabIndex={-1}
              role="application"
              aria-roledescription={p.phrases.roleDescription}
              aria-label={p.phrases.calendarLabel}
            >
              {!verticalScrollable && p.navPosition === NAV_POSITION_TOP && this.renderNavigation()}
              <div
                {...p.css(
                  p.styles.DayPicker_transitionContainer,
                  isHorizontal && s.hasSetHeight
                    && p.styles.DayPicker_transitionContainer__horizontal,
                  this.isVertical() && p.styles.DayPicker_transitionContainer__vertical,
                  verticalScrollable && p.styles.DayPicker_transitionContainer__verticalScrollable,
                  { width: wrapperWidth, height },
                )}
                ref={this.setTransitionContainerRef}
              >
                {verticalScrollable && this.renderNavigation(PREV_NAV)}
                {!p.hidden && (
                  <CalendarMonthGrid
                    setMonthTitleHeight={!s.monthTitleHeight ? this.setMonthTitleHeight : undefined}
                    translationValue={s.translationValue}
                    enableOutsideDays={p.enableOutsideDays}
                    firstVisibleMonthIndex={this.getFirstVisibleIndex()}
                    initialMonth={s.currentMonth}
                    isAnimating={isAnimating}
                    modifiers={p.modifiers}
                    orientation={p.orientation}
                    numberOfMonths={p.numberOfMonths * s.scrollableMonthMultiple}
                    onDayClick={p.onDayClick}
                    onDayMouseEnter={p.onDayMouseEnter}
                    onDayMouseLeave={p.onDayMouseLeave}
                    onMonthChange={this.onMonthChange}
                    onYearChange={this.onYearChange}
                    renderMonthText={p.renderMonthText}
                    renderCalendarDay={p.renderCalendarDay}
                    renderDayContents={p.renderDayContents}
                    renderMonthElement={p.renderMonthElement}
                    onMonthTransitionEnd={this.updateStateAfterMonthTransition}
                    monthFormat={p.monthFormat}
                    daySize={p.daySize}
                    firstDayOfWeek={p.firstDayOfWeek}
                    isFocused={shouldFocusDate}
                    focusedDate={s.focusedDate}
                    phrases={p.phrases}
                    isRTL={p.isRTL}
                    dayAriaLabelFormat={p.dayAriaLabelFormat}
                    transitionDuration={p.transitionDuration}
                    verticalBorderSpacing={p.verticalBorderSpacing}
                    horizontalMonthPadding={p.horizontalMonthPadding}
                  />
                )}
                {verticalScrollable && this.renderNavigation(NEXT_NAV)}
              </div>
              {!verticalScrollable && p.navPosition === NAV_POSITION_BOTTOM
                && this.renderNavigation()}
              {!s.isTouchDevice && !p.hideKeyboardShortcutsPanel && (
                <DayPickerKeyboardShortcuts
                  block={this.isVertical() && !p.withPortal}
                  buttonLocation={keyboardButtonLocation}
                  showKeyboardShortcutsPanel={s.showKeyboardShortcuts}
                  openKeyboardShortcutsPanel={this.openKeyboardShortcutsPanel}
                  closeKeyboardShortcutsPanel={this.closeKeyboardShortcutsPanel}
                  phrases={p.phrases}
                  renderKeyboardShortcutsButton={p.renderKeyboardShortcutsButton}
                  renderKeyboardShortcutsPanel={p.renderKeyboardShortcutsPanel}
                />
              )}
            </div>
          </div>
          {calendarInfoAfter && calendarInfo}
        </OutsideClickHandler>
      </div>
    );
  }
}

export default withStyles(staticStyles, { pureComponent: true })(DayPicker);
