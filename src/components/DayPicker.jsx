/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from '../internal/propTypes';
import { endOfWeek, getCalendarMonthWeeks, getWeekdayLabels, isDateTime, startOfWeek } from '../internal/date';
import { isTouchDevice } from '../internal/browser/touch';
import throttle from '../internal/browser/throttle';
import { getActiveElement } from '../internal/browser/activeElement';
import { withStyles, withStylesPropTypes } from '../internal/styles';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import CalendarMonthGrid from './CalendarMonthGrid';
import DayPickerNavigation from './DayPickerNavigation';
import DayPickerKeyboardShortcuts, { TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT } from './DayPickerKeyboardShortcuts';
import OutsideClickHandler from '../internal/browser/outsideClick.jsx';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth';
import calculateDimension from '../utils/calculateDimension';
import pickComponentProps from '../internal/pickComponentProps';
import { HORIZONTAL_ORIENTATION, VERTICAL_ORIENTATION, VERTICAL_SCROLLABLE, DAY_SIZE, DEFAULT_MONTH_FORMAT, DEFAULT_WEEKDAY_FORMAT, DEFAULT_DAY_ARIA_FORMAT, INFO_POSITION_TOP, INFO_POSITION_BOTTOM, INFO_POSITION_BEFORE, INFO_POSITION_AFTER, MODIFIER_KEY_NAMES, NAV_POSITION_TOP, NAV_POSITION_BOTTOM } from '../constants';

const dateFormatProp = PropTypes.oneOfType([PropTypes.object, PropTypes.func]);
const styleKeys = [
  'DayPicker', 'DayPicker__horizontal', 'DayPicker__verticalScrollable', 'DayPicker_portal__horizontal', 'DayPicker_portal__vertical', 'DayPicker__hidden', 'DayPicker__withBorder', 'DayPicker_wrapper__horizontal', 'DayPicker_weekHeaders', 'DayPicker_weekHeaders__horizontal', 'DayPicker_focusRegion', 'DayPicker_transitionContainer', 'DayPicker_transitionContainer__horizontal', 'DayPicker_transitionContainer__vertical', 'DayPicker_transitionContainer__verticalScrollable', 'DayPicker_weekHeader', 'DayPicker_weekHeader__vertical', 'DayPicker_weekHeader__verticalScrollable', 'DayPicker_weekHeader_ul', 'DayPicker_weekHeader_li',
];
const staticStyles = () => styleKeys.reduce((result, key) => ({ ...result, [key]: {} }), {});

const propTypes = forbidExtraProps({
  ...withStylesPropTypes, enableOutsideDays: PropTypes.bool, numberOfMonths: PropTypes.number, orientation: PropTypes.string, withPortal: PropTypes.bool, onOutsideClick: PropTypes.func, hidden: PropTypes.bool, initialVisibleMonth: PropTypes.func, firstDayOfWeek: PropTypes.number, renderCalendarInfo: PropTypes.func, calendarInfoPosition: PropTypes.string, hideKeyboardShortcutsPanel: PropTypes.bool, daySize: nonNegativeInteger, isRTL: PropTypes.bool, verticalHeight: nonNegativeInteger, noBorder: PropTypes.bool, transitionDuration: nonNegativeInteger, verticalBorderSpacing: nonNegativeInteger, horizontalMonthPadding: nonNegativeInteger, renderKeyboardShortcutsButton: PropTypes.func, renderKeyboardShortcutsPanel: PropTypes.func,
  dayPickerNavigationInlineStyles: PropTypes.object, disablePrev: PropTypes.bool, disableNext: PropTypes.bool, navPosition: PropTypes.string, navPrev: PropTypes.node, navNext: PropTypes.node, renderNavPrevButton: PropTypes.func, renderNavNextButton: PropTypes.func, noNavButtons: PropTypes.bool, noNavNextButton: PropTypes.bool, noNavPrevButton: PropTypes.bool, onPrevMonthClick: PropTypes.func, onNextMonthClick: PropTypes.func, onMonthChange: PropTypes.func, onYearChange: PropTypes.func, onGetNextScrollableMonths: PropTypes.func, onGetPrevScrollableMonths: PropTypes.func,
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), renderWeekHeaderElement: PropTypes.func, modifiers: PropTypes.object, renderCalendarDay: PropTypes.func, renderDayContents: PropTypes.func, onDayClick: PropTypes.func, onDayMouseEnter: PropTypes.func, onDayMouseLeave: PropTypes.func, isFocused: PropTypes.bool, getFirstFocusableDay: PropTypes.func, onBlur: PropTypes.func, showKeyboardShortcuts: PropTypes.bool, onTab: PropTypes.func, onShiftTab: PropTypes.func, monthFormat: dateFormatProp, weekDayFormat: dateFormatProp, dayAriaLabelFormat: dateFormatProp, phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)), locale: PropTypes.string,
});

const defaultProps = { enableOutsideDays: false, numberOfMonths: 2, orientation: HORIZONTAL_ORIENTATION, withPortal: false, onOutsideClick() {}, hidden: false, initialVisibleMonth: () => DateTime.local(), firstDayOfWeek: null, renderCalendarInfo: null, calendarInfoPosition: INFO_POSITION_BOTTOM, hideKeyboardShortcutsPanel: false, daySize: DAY_SIZE, isRTL: false, verticalHeight: null, noBorder: false, transitionDuration: 200, verticalBorderSpacing: undefined, horizontalMonthPadding: 13, renderKeyboardShortcutsButton: undefined, renderKeyboardShortcutsPanel: undefined, dayPickerNavigationInlineStyles: null, disablePrev: false, disableNext: false, navPosition: NAV_POSITION_TOP, navPrev: null, navNext: null, renderNavPrevButton: null, renderNavNextButton: null, noNavButtons: false, noNavNextButton: false, noNavPrevButton: false, onPrevMonthClick() {}, onNextMonthClick() {}, onMonthChange() {}, onYearChange() {}, onGetNextScrollableMonths() {}, onGetPrevScrollableMonths() {}, renderMonthText: null, renderMonthElement: null, renderWeekHeaderElement: null, modifiers: {}, renderCalendarDay: undefined, renderDayContents: null, onDayClick() {}, onDayMouseEnter() {}, onDayMouseLeave() {}, isFocused: false, getFirstFocusableDay: null, onBlur() {}, showKeyboardShortcuts: false, onTab() {}, onShiftTab() {}, monthFormat: DEFAULT_MONTH_FORMAT, weekDayFormat: DEFAULT_WEEKDAY_FORMAT, dayAriaLabelFormat: DEFAULT_DAY_ARIA_FORMAT, phrases: DayPickerPhrases, locale: undefined };

function optionsFor(props, value) { return { locale: props.locale, ...(typeof value === 'object' && value ? value : {}) }; }

class DayPicker extends React.PureComponent {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const initialMonth = props.hidden ? DateTime.local() : props.initialVisibleMonth();
    const currentMonth = isDateTime(initialMonth) ? initialMonth.startOf('month') : DateTime.local();
    const focusedDate = props.getFirstFocusableDay ? props.getFirstFocusableDay(currentMonth) : currentMonth.startOf('month');
    this.state = { currentMonth, focusedDate: (!props.hidden || props.isFocused) ? focusedDate : null, monthTransition: null, translationValue: 0, scrollableMonthMultiple: 1, calendarMonthWidth: getCalendarMonthWidth(props.daySize, props.horizontalMonthPadding), showKeyboardShortcuts: props.showKeyboardShortcuts, isTouchDevice: isTouchDevice(), withMouseInteractions: true, calendarInfoWidth: 0, monthTitleHeight: null, hasSetHeight: false };
    this.calendarMonthWeeks = [];
    this.setCalendarMonthWeeks(currentMonth);
    this.throttledKeyDown = throttle((event) => this.onFinalKeyDown(event), 200, { trailing: false });
    ['onKeyDown', 'onFinalKeyDown', 'onPrevMonthClick', 'onNextMonthClick', 'onMonthChange', 'onYearChange', 'updateStateAfterMonthTransition', 'openKeyboardShortcutsPanel', 'closeKeyboardShortcutsPanel', 'setContainerRef', 'setTransitionContainerRef', 'setCalendarInfoRef', 'setMonthTitleHeight'].forEach((name) => { this[name] = this[name].bind(this); });
  }
  componentDidMount() { this.setState({ isTouchDevice: isTouchDevice() }); }
  componentDidUpdate(prevProps) { if (prevProps.daySize !== this.props.daySize) this.setState({ calendarMonthWidth: getCalendarMonthWidth(this.props.daySize, this.props.horizontalMonthPadding) }); if (prevProps.isFocused !== this.props.isFocused && this.props.isFocused && !this.state.focusedDate) this.setState({ focusedDate: this.getFocusedDay(this.state.currentMonth) }); }
  componentWillUnmount() { this.throttledKeyDown.cancel(); clearTimeout(this.setCalendarInfoWidthTimeout); clearTimeout(this.setCalendarMonthGridHeightTimeout); }
  isHorizontal() { return this.props.orientation === HORIZONTAL_ORIENTATION; }
  isVertical() { return this.props.orientation === VERTICAL_ORIENTATION || this.props.orientation === VERTICAL_SCROLLABLE; }
  getFirstDayOfWeek() { return this.props.firstDayOfWeek == null ? 1 : this.props.firstDayOfWeek; }
  setCalendarMonthWeeks(month) { this.calendarMonthWeeks = []; let current = month.minus({ months: 1 }); for (let i = 0; i < this.props.numberOfMonths + 2; i += 1) { this.calendarMonthWeeks.push(getCalendarMonthWeeks(current, { firstDayOfWeek: this.getFirstDayOfWeek(), enableOutsideDays: true }).length); current = current.plus({ months: 1 }); } }
  getWeekHeaders() {
    const format = this.props.weekDayFormat;
    return getWeekdayLabels(optionsFor(this.props, format), typeof format === 'function' ? format : null);
  }
  getFocusedDay(month) { const candidate = this.props.getFirstFocusableDay?.(month) || month.startOf('month'); return isDateTime(candidate) ? candidate : month.startOf('month'); }
  onKeyDown(event) { event.stopPropagation(); if (!MODIFIER_KEY_NAMES.has(event.key)) this.throttledKeyDown(event); }
  onFinalKeyDown(event) {
    const { focusedDate } = this.state; if (!focusedDate) return; let next = focusedDate; const rtl = this.props.isRTL;
    switch (event.key) {
      case 'ArrowUp': event.preventDefault(); next = next.minus({ days: 7 }); break;
      case 'ArrowDown': event.preventDefault(); next = next.plus({ days: 7 }); break;
      case 'ArrowLeft': event.preventDefault(); next = next.plus({ days: rtl ? 1 : -1 }); break;
      case 'ArrowRight': event.preventDefault(); next = next.plus({ days: rtl ? -1 : 1 }); break;
      case 'Home': event.preventDefault(); next = startOfWeek(next, { ...optionsFor(this.props, {}), firstDayOfWeek: this.getFirstDayOfWeek() }); break;
      case 'End': event.preventDefault(); next = endOfWeek(next, { ...optionsFor(this.props, {}), firstDayOfWeek: this.getFirstDayOfWeek() }); break;
      case 'PageUp': event.preventDefault(); next = next.minus({ months: 1 }); break;
      case 'PageDown': event.preventDefault(); next = next.plus({ months: 1 }); break;
      case '?': this.openKeyboardShortcutsPanel(() => getActiveElement()?.focus()); return;
      case 'Escape': if (this.state.showKeyboardShortcuts) this.closeKeyboardShortcutsPanel(); else this.props.onBlur(event); return;
      case 'Tab': event.shiftKey ? this.props.onShiftTab() : this.props.onTab(event); return;
      default: return;
    }
    this.setState({ focusedDate: next, withMouseInteractions: false });
  }
  onPrevMonthClick(event) { event?.preventDefault(); const month = this.state.currentMonth.minus({ months: 1 }); this.setState({ currentMonth: month, focusedDate: null }, () => this.props.onPrevMonthClick(month)); }
  onNextMonthClick(event) { event?.preventDefault(); const month = this.state.currentMonth.plus({ months: 1 }); this.setState({ currentMonth: month, focusedDate: null }, () => this.props.onNextMonthClick(month)); }
  onMonthChange(month) { this.setState({ currentMonth: month.startOf('month'), focusedDate: null }, () => this.props.onMonthChange(month)); }
  onYearChange(month) { this.setState({ currentMonth: month.startOf('month'), focusedDate: null }, () => this.props.onYearChange(month)); }
  updateStateAfterMonthTransition() { this.setState({ monthTransition: null, translationValue: 0, focusedDate: this.state.focusedDate || this.getFocusedDay(this.state.currentMonth) }); }
  openKeyboardShortcutsPanel(onClose) { this.setState({ showKeyboardShortcuts: true, onKeyboardShortcutsPanelClose: onClose }); }
  closeKeyboardShortcutsPanel() { this.state.onKeyboardShortcutsPanelClose?.(); this.setState({ showKeyboardShortcuts: false, onKeyboardShortcutsPanelClose: null }); }
  setContainerRef(ref) { this.container = ref; }
  setTransitionContainerRef(ref) { this.transitionContainer = ref; }
  setCalendarInfoRef(ref) { this.calendarInfo = ref; }
  setMonthTitleHeight(value) { this.setState({ monthTitleHeight: value }); }
  getFirstVisibleIndex() { return this.props.orientation === VERTICAL_SCROLLABLE ? 0 : 1; }
  getNextScrollableMonths(event) { event?.preventDefault(); this.props.onGetNextScrollableMonths(event); this.setState(({ scrollableMonthMultiple }) => ({ scrollableMonthMultiple: scrollableMonthMultiple + 1 })); }
  getPrevScrollableMonths(event) { event?.preventDefault(); this.props.onGetPrevScrollableMonths(event); this.setState(({ currentMonth, scrollableMonthMultiple }) => ({ currentMonth: currentMonth.minus({ months: this.props.numberOfMonths }), scrollableMonthMultiple: scrollableMonthMultiple + 1 })); }
  renderNavigation(direction) { const p = this.props; return <DayPickerNavigation {...pickComponentProps(DayPickerNavigation, p)} navPosition={p.navPosition} navPrev={p.navPrev} navNext={p.navNext} onPrevMonthClick={this.onPrevMonthClick} onNextMonthClick={this.onNextMonthClick} showNavPrevButton={!p.noNavPrevButton && direction !== 'next_nav'} showNavNextButton={!p.noNavNextButton && direction !== 'prev_nav'} />; }
  render() {
    const p = this.props; const s = this.state; const verticalScrollable = p.orientation === VERTICAL_SCROLLABLE; const style = { width: this.isHorizontal() ? s.calendarMonthWidth * p.numberOfMonths : undefined };
    const headers = this.getWeekHeaders().map((day, index) => <li key={`${index}-${day}`}><small>{day}</small></li>);
    return <div className="DayPicker" dir={p.isRTL ? 'rtl' : 'ltr'}><OutsideClickHandler onOutsideClick={p.onOutsideClick}><div className="DayPicker_weekHeaders" aria-hidden="true"><ul>{headers}</ul></div><div ref={this.setContainerRef} className="DayPicker_focusRegion" onKeyDown={this.onKeyDown} onMouseUp={() => this.setState({ withMouseInteractions: true })} tabIndex={-1} role="application" aria-label={p.phrases.calendarLabel}>{!verticalScrollable && p.navPosition === NAV_POSITION_TOP && this.renderNavigation()}<div ref={this.setTransitionContainerRef} style={style}>{verticalScrollable && this.renderNavigation('prev_nav')}{!p.hidden && <CalendarMonthGrid {...pickComponentProps(CalendarMonthGrid, p)} initialMonth={s.currentMonth} firstVisibleMonthIndex={this.getFirstVisibleIndex()} numberOfMonths={p.numberOfMonths * s.scrollableMonthMultiple} focusedDate={s.focusedDate} isFocused={p.isFocused} onMonthTransitionEnd={this.updateStateAfterMonthTransition} onMonthChange={this.onMonthChange} onYearChange={this.onYearChange} />} {verticalScrollable && this.renderNavigation('next_nav')}</div>{!verticalScrollable && p.navPosition === NAV_POSITION_BOTTOM && this.renderNavigation()}</div>{!s.isTouchDevice && !p.hideKeyboardShortcutsPanel && <DayPickerKeyboardShortcuts block={this.isVertical() && !p.withPortal} buttonLocation={this.isVertical() ? (p.withPortal ? TOP_LEFT : TOP_RIGHT) : BOTTOM_RIGHT} showKeyboardShortcutsPanel={s.showKeyboardShortcuts} openKeyboardShortcutsPanel={this.openKeyboardShortcutsPanel} closeKeyboardShortcutsPanel={this.closeKeyboardShortcutsPanel} phrases={p.phrases} renderKeyboardShortcutsButton={p.renderKeyboardShortcutsButton} renderKeyboardShortcutsPanel={p.renderKeyboardShortcutsPanel} />}</OutsideClickHandler></div>;
  }
}

export default withStyles(staticStyles, { pureComponent: true })(DayPicker);
