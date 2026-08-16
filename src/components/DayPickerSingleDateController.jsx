import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from '../internal/propTypes';
import { addDays, addMonths, compareDates, endOfMonth, getWeekday, isoDate, startOfMonth } from '../internal/date';
import { isTouchDevice } from '../internal/browser/touch';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import isSameDay from '../utils/isSameDay';
import isAfterDay from '../utils/isAfterDay';
import isDayVisible from '../utils/isDayVisible';
import getVisibleDays from '../utils/getVisibleDays';
import { addModifier, deleteModifier } from '../utils/modifiers';

import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import CalendarInfoPositionShape from '../shapes/CalendarInfoPositionShape';
import NavPositionShape from '../shapes/NavPositionShape';
import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
  INFO_POSITION_BOTTOM,
  NAV_POSITION_TOP,
} from '../constants';
import DayPicker from './DayPicker';

const DATE_UNSET_VALUE = null;
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateFormatProp = PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.func]);

const propTypes = forbidExtraProps({
  date: isoDate,
  minDate: isoDate,
  maxDate: isoDate,
  onDateChange: PropTypes.func,
  allowUnselect: PropTypes.bool,
  focused: PropTypes.bool,
  onFocusChange: PropTypes.func,
  onClose: PropTypes.func,
  keepOpenOnDateSelect: PropTypes.bool,
  isOutsideRange: PropTypes.func,
  isDayBlocked: PropTypes.func,
  isDayHighlighted: PropTypes.func,
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderWeekHeaderElement: PropTypes.func,
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  firstDayOfWeek: DayOfWeekShape,
  hideKeyboardShortcutsPanel: PropTypes.bool,
  daySize: nonNegativeInteger,
  verticalHeight: nonNegativeInteger,
  noBorder: PropTypes.bool,
  verticalBorderSpacing: nonNegativeInteger,
  transitionDuration: nonNegativeInteger,
  horizontalMonthPadding: nonNegativeInteger,
  dayPickerNavigationInlineStyles: PropTypes.object,
  navPosition: NavPositionShape,
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  renderNavPrevButton: PropTypes.func,
  renderNavNextButton: PropTypes.func,
  noNavButtons: PropTypes.bool,
  noNavNextButton: PropTypes.bool,
  noNavPrevButton: PropTypes.bool,
  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  onOutsideClick: PropTypes.func,
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: CalendarInfoPositionShape,
  onBlur: PropTypes.func,
  isFocused: PropTypes.bool,
  showKeyboardShortcuts: PropTypes.bool,
  onTab: PropTypes.func,
  onShiftTab: PropTypes.func,
  monthFormat: dateFormatProp,
  weekDayFormat: dateFormatProp,
  phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)),
  dayAriaLabelFormat: dateFormatProp,
  locale: PropTypes.string,
  calendar: PropTypes.string,
  numberingSystem: PropTypes.string,
  isRTL: PropTypes.bool,
});

const defaultProps = {
  date: DATE_UNSET_VALUE, minDate: null, maxDate: null,
  onDateChange() {}, allowUnselect: false, focused: false,
  onFocusChange() {}, onClose() {}, keepOpenOnDateSelect: false,
  isOutsideRange() { return false; }, isDayBlocked() { return false; }, isDayHighlighted() { return false; },
  renderMonthText: null, renderMonthElement: null, renderWeekHeaderElement: null,
  enableOutsideDays: false, numberOfMonths: 1, orientation: HORIZONTAL_ORIENTATION,
  withPortal: false, hideKeyboardShortcutsPanel: false, initialVisibleMonth: null,
  firstDayOfWeek: null, daySize: DAY_SIZE, verticalHeight: null, noBorder: false,
  verticalBorderSpacing: undefined, transitionDuration: undefined, horizontalMonthPadding: 13,
  dayPickerNavigationInlineStyles: null, navPosition: NAV_POSITION_TOP, navPrev: null, navNext: null,
  renderNavPrevButton: null, renderNavNextButton: null, noNavButtons: false,
  noNavNextButton: false, noNavPrevButton: false, onPrevMonthClick() {}, onNextMonthClick() {},
  onOutsideClick() {}, renderCalendarDay: undefined, renderDayContents: null, renderCalendarInfo: null,
  calendarInfoPosition: INFO_POSITION_BOTTOM, onBlur() {}, isFocused: false,
  showKeyboardShortcuts: false, onTab() {}, onShiftTab() {}, monthFormat: 'MMMM YYYY',
  weekDayFormat: 'dd', phrases: DayPickerPhrases, dayAriaLabelFormat: undefined,
  locale: undefined, calendar: undefined, numberingSystem: undefined, isRTL: false,
};

function formatOptions(props, value) {
  const option = typeof value === 'object' && value ? value : {};
  return { locale: props.locale, calendar: props.calendar, numberingSystem: props.numberingSystem, ...option };
}

export default class DayPickerSingleDateController extends React.PureComponent {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.isTouchDevice = isTouchDevice();
    this.today = todayISO();
    this.modifiers = {
      today: (day) => this.isToday(day), blocked: (day) => this.isBlocked(day),
      'blocked-calendar': (day) => props.isDayBlocked(day),
      'blocked-out-of-range': (day) => props.isOutsideRange(day),
      'highlighted-calendar': (day) => props.isDayHighlighted(day), valid: (day) => !this.isBlocked(day),
      hovered: (day) => this.isHovered(day), selected: (day) => this.isSelected(day),
      'first-day-of-week': (day) => this.isFirstDayOfWeek(day), 'last-day-of-week': (day) => this.isLastDayOfWeek(day),
    };
    const { currentMonth, visibleDays } = this.getStateForNewMonth(props);
    this.state = { hoverDate: null, currentMonth, visibleDays, disablePrev: this.shouldDisableMonthNavigation(props.minDate, currentMonth), disableNext: this.shouldDisableMonthNavigation(props.maxDate, currentMonth) };
    ['onDayMouseEnter', 'onDayMouseLeave', 'onDayClick', 'onPrevMonthClick', 'onNextMonthClick', 'onMonthChange', 'onYearChange', 'onGetNextScrollableMonths', 'onGetPrevScrollableMonths', 'getFirstFocusableDay'].forEach((name) => { this[name] = this[name].bind(this); });
  }

  componentDidMount() { this.isTouchDevice = isTouchDevice(); }

  componentDidUpdate(prevProps) {
    const { date, numberOfMonths, enableOutsideDays, focused, initialVisibleMonth, isOutsideRange, isDayBlocked, isDayHighlighted } = this.props;
    if (date !== prevProps.date || numberOfMonths !== prevProps.numberOfMonths || enableOutsideDays !== prevProps.enableOutsideDays || (focused && initialVisibleMonth !== prevProps.initialVisibleMonth)) {
      const next = this.getStateForNewMonth(this.props);
      if (next.currentMonth !== this.state.currentMonth || date !== prevProps.date) this.setState(next);
    }
    if (isOutsideRange !== prevProps.isOutsideRange) this.modifiers['blocked-out-of-range'] = (day) => isOutsideRange(day);
    if (isDayBlocked !== prevProps.isDayBlocked) this.modifiers['blocked-calendar'] = (day) => isDayBlocked(day);
    if (isDayHighlighted !== prevProps.isDayHighlighted) this.modifiers['highlighted-calendar'] = (day) => isDayHighlighted(day);
    const now = todayISO();
    if (now !== this.today) this.today = now;
  }

  onDayClick(day, event) {
    event?.preventDefault();
    if (this.isBlocked(day)) return;
    const clicked = this.props.allowUnselect && this.isSelected(day) ? DATE_UNSET_VALUE : day;
    this.props.onDateChange(clicked);
    if (!this.props.keepOpenOnDateSelect) { this.props.onFocusChange({ focused: false }); this.props.onClose({ date: clicked }); }
  }
  onDayMouseEnter(day) { if (!this.isTouchDevice) this.setState(({ visibleDays, hoverDate }) => ({ hoverDate: day, visibleDays: { ...visibleDays, ...this.addModifier(this.deleteModifier({}, hoverDate, 'hovered'), day, 'hovered') } })); }
  onDayMouseLeave() { if (!this.isTouchDevice && this.state.hoverDate) this.setState(({ visibleDays, hoverDate }) => ({ hoverDate: null, visibleDays: { ...visibleDays, ...this.deleteModifier({}, hoverDate, 'hovered') } })); }
  onPrevMonthClick() { this.changeMonth(-1, this.props.onPrevMonthClick); }
  onNextMonthClick() { this.changeMonth(1, this.props.onNextMonthClick); }
  changeMonth(amount, callback) {
    const { currentMonth, visibleDays } = this.state; const { numberOfMonths, enableOutsideDays, minDate, maxDate } = this.props;
    const month = addMonths(currentMonth, amount); if (!month) return;
    const nextDays = getVisibleDays(addMonths(currentMonth, amount * (amount < 0 ? 1 : numberOfMonths)) || month, 1, enableOutsideDays);
    const retained = Object.keys(visibleDays).sort().slice(amount < 0 ? 0 : 1).reduce((acc, key) => ({ ...acc, [key]: visibleDays[key] }), {});
    this.setState({ currentMonth: month, disablePrev: this.shouldDisableMonthNavigation(minDate, month), disableNext: this.shouldDisableMonthNavigation(maxDate, month), visibleDays: { ...retained, ...this.getModifiers(nextDays) } }, () => callback(month));
  }
  onMonthChange(month) { this.setMonth(month); }
  onYearChange(month) { this.setMonth(month); }
  setMonth(month) { const { numberOfMonths, enableOutsideDays, orientation } = this.props; this.setState({ currentMonth: month, visibleDays: this.getModifiers(getVisibleDays(month, numberOfMonths, enableOutsideDays, orientation === VERTICAL_SCROLLABLE)) }); }
  onGetNextScrollableMonths() { const month = addMonths(this.state.currentMonth, Object.keys(this.state.visibleDays).length); this.setState(({ visibleDays }) => ({ visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } })); }
  onGetPrevScrollableMonths() { const month = addMonths(this.state.currentMonth, -this.props.numberOfMonths); this.setState(({ visibleDays }) => ({ currentMonth: month, visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } })); }
  getFirstDayOfWeek() { return this.props.firstDayOfWeek == null ? 1 : this.props.firstDayOfWeek; }
  getFirstFocusableDay(month) {
    const { date, numberOfMonths } = this.props; let focused = date || startOfMonth(month);
    if (this.isBlocked(focused)) { const end = endOfMonth(addMonths(month, numberOfMonths - 1)); let cursor = focused; while (cursor && end && compareDates(cursor, end) <= 0) { cursor = addDays(cursor, 1); if (cursor && !this.isBlocked(cursor)) return cursor; } }
    return focused;
  }
  getModifiers(visibleDays) { return Object.keys(visibleDays).reduce((result, month) => ({ ...result, [month]: visibleDays[month].reduce((days, day) => ({ ...days, [day]: this.getModifiersForDay(day) }), {}) }), {}); }
  getModifiersForDay(day) { return new Set(Object.keys(this.modifiers).filter((modifier) => this.modifiers[modifier](day))); }
  getStateForNewMonth(props) { const month = (props.initialVisibleMonth || (props.date ? () => props.date : todayISO))(); const currentMonth = startOfMonth(month) || todayISO(); return { currentMonth, visibleDays: this.getModifiers(getVisibleDays(currentMonth, props.numberOfMonths, props.enableOutsideDays, props.orientation === VERTICAL_SCROLLABLE)) }; }
  shouldDisableMonthNavigation(date, month) { return Boolean(date && isDayVisible(date, month, this.props.numberOfMonths, this.props.enableOutsideDays)); }
  addModifier(updated, day, modifier) { return day ? addModifier(updated, day, modifier, this.props, this.state) : updated; }
  deleteModifier(updated, day, modifier) { return day ? deleteModifier(updated, day, modifier, this.props, this.state) : updated; }
  isBlocked(day) { return this.props.isDayBlocked(day) || this.props.isOutsideRange(day); }
  isHovered(day) { return isSameDay(day, this.state?.hoverDate); }
  isSelected(day) { return isSameDay(day, this.props.date); }
  isToday(day) { return isSameDay(day, this.today); }
  isFirstDayOfWeek(day) { return getWeekday(day) === this.getFirstDayOfWeek(); }
  isLastDayOfWeek(day) { return getWeekday(day) === (this.getFirstDayOfWeek() + 6) % 7; }

  render() {
    const p = this.props; const s = this.state;
    return <DayPicker {...p} {...formatOptions(p, {})} orientation={p.orientation} modifiers={s.visibleDays} currentMonth={s.currentMonth} initialVisibleMonth={() => s.currentMonth} hidden={!p.focused} disablePrev={s.disablePrev} disableNext={s.disableNext} onDayClick={this.onDayClick} onDayMouseEnter={this.onDayMouseEnter} onDayMouseLeave={this.onDayMouseLeave} onPrevMonthClick={this.onPrevMonthClick} onNextMonthClick={this.onNextMonthClick} onMonthChange={this.onMonthChange} onYearChange={this.onYearChange} onGetNextScrollableMonths={this.onGetNextScrollableMonths} onGetPrevScrollableMonths={this.onGetPrevScrollableMonths} getFirstFocusableDay={this.getFirstFocusableDay} monthFormat={formatOptions(p, p.monthFormat)} weekDayFormat={formatOptions(p, p.weekDayFormat)} dayAriaLabelFormat={formatOptions(p, p.dayAriaLabelFormat)} />;
  }
}
