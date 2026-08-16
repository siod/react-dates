import React from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from '../internal/propTypes';
import { compareDates, dateTime } from '../internal/date';
import { isTouchDevice } from '../internal/browser/touch';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import isSameDay from '../utils/isSameDay';
import isAfterDay from '../utils/isAfterDay';
import isBeforeDay from '../utils/isBeforeDay';
import isDayVisible from '../utils/isDayVisible';
import getVisibleDays from '../utils/getVisibleDays';
import toISODateString from '../utils/toISODateString';
import { addModifier, deleteModifier } from '../utils/modifiers';
import DisabledShape from '../shapes/DisabledShape';
import FocusedInputShape from '../shapes/FocusedInputShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';
import CalendarInfoPositionShape from '../shapes/CalendarInfoPositionShape';
import NavPositionShape from '../shapes/NavPositionShape';
import { START_DATE, END_DATE, HORIZONTAL_ORIENTATION, VERTICAL_SCROLLABLE, DAY_SIZE, DEFAULT_MONTH_FORMAT, DEFAULT_WEEKDAY_FORMAT, DEFAULT_DAY_ARIA_FORMAT, INFO_POSITION_BOTTOM, NAV_POSITION_TOP } from '../constants';
import DayPicker from './DayPicker';
import pickComponentProps from '../internal/pickComponentProps';

const dateFormatProp = PropTypes.oneOfType([PropTypes.object, PropTypes.func]);
const propTypes = forbidExtraProps({
  startDate: dateTime, endDate: dateTime, onDatesChange: PropTypes.func,
  startDateOffset: PropTypes.func, endDateOffset: PropTypes.func, minDate: dateTime, maxDate: dateTime,
  focusedInput: FocusedInputShape, onFocusChange: PropTypes.func, onClose: PropTypes.func,
  keepOpenOnDateSelect: PropTypes.bool, minimumNights: nonNegativeInteger, disabled: DisabledShape,
  isOutsideRange: PropTypes.func, isDayBlocked: PropTypes.func, isDayHighlighted: PropTypes.func,
  getMinNightsForHoverDate: PropTypes.func, daysViolatingMinNightsCanBeClicked: PropTypes.bool,
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'), renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderWeekHeaderElement: PropTypes.func, enableOutsideDays: PropTypes.bool, numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape, withPortal: PropTypes.bool, initialVisibleMonth: PropTypes.func,
  hideKeyboardShortcutsPanel: PropTypes.bool, daySize: nonNegativeInteger, noBorder: PropTypes.bool,
  verticalBorderSpacing: nonNegativeInteger, horizontalMonthPadding: nonNegativeInteger, transitionDuration: nonNegativeInteger,
  dayPickerNavigationInlineStyles: PropTypes.object, navPosition: NavPositionShape, navPrev: PropTypes.node, navNext: PropTypes.node,
  renderNavPrevButton: PropTypes.func, renderNavNextButton: PropTypes.func, noNavButtons: PropTypes.bool, noNavNextButton: PropTypes.bool, noNavPrevButton: PropTypes.bool,
  onPrevMonthClick: PropTypes.func, onNextMonthClick: PropTypes.func, onOutsideClick: PropTypes.func,
  renderCalendarDay: PropTypes.func, renderDayContents: PropTypes.func, renderCalendarInfo: PropTypes.func, renderKeyboardShortcutsButton: PropTypes.func, renderKeyboardShortcutsPanel: PropTypes.func,
  calendarInfoPosition: CalendarInfoPositionShape, firstDayOfWeek: DayOfWeekShape, verticalHeight: nonNegativeInteger, onBlur: PropTypes.func, isFocused: PropTypes.bool, showKeyboardShortcuts: PropTypes.bool, onTab: PropTypes.func, onShiftTab: PropTypes.func,
  monthFormat: dateFormatProp, weekDayFormat: dateFormatProp, dayAriaLabelFormat: dateFormatProp, phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)), locale: PropTypes.string, isRTL: PropTypes.bool,
});

const defaultProps = {
  startDate: null, endDate: null, minDate: null, maxDate: null, onDatesChange() {}, startDateOffset: undefined, endDateOffset: undefined,
  focusedInput: null, onFocusChange() {}, onClose() {}, keepOpenOnDateSelect: false, minimumNights: 1, disabled: false,
  isOutsideRange() { return false; }, isDayBlocked() { return false; }, isDayHighlighted() { return false; }, getMinNightsForHoverDate() { return 0; }, daysViolatingMinNightsCanBeClicked: false,
  renderMonthText: null, renderMonthElement: null, renderWeekHeaderElement: null, enableOutsideDays: false, numberOfMonths: 1, orientation: HORIZONTAL_ORIENTATION, withPortal: false, initialVisibleMonth: null, hideKeyboardShortcutsPanel: false, daySize: DAY_SIZE, noBorder: false, verticalBorderSpacing: undefined, horizontalMonthPadding: 13, transitionDuration: undefined,
  dayPickerNavigationInlineStyles: null, navPosition: NAV_POSITION_TOP, navPrev: null, navNext: null, renderNavPrevButton: null, renderNavNextButton: null, noNavButtons: false, noNavNextButton: false, noNavPrevButton: false, onPrevMonthClick() {}, onNextMonthClick() {}, onOutsideClick() {}, renderCalendarDay: undefined, renderDayContents: null, renderCalendarInfo: null, renderKeyboardShortcutsButton: undefined, renderKeyboardShortcutsPanel: undefined, calendarInfoPosition: INFO_POSITION_BOTTOM, firstDayOfWeek: null, verticalHeight: null, onBlur() {}, isFocused: false, showKeyboardShortcuts: false, onTab() {}, onShiftTab() {}, monthFormat: DEFAULT_MONTH_FORMAT, weekDayFormat: DEFAULT_WEEKDAY_FORMAT, dayAriaLabelFormat: DEFAULT_DAY_ARIA_FORMAT, phrases: DayPickerPhrases, locale: undefined, isRTL: false,
};

function formatOptions(props, value) { return { locale: props.locale, ...(typeof value === 'object' && value ? value : {}) }; }

export default class DayPickerRangeController extends React.PureComponent {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props); this.isTouchDevice = isTouchDevice(); this.today = DateTime.local();
    this.modifiers = {
      today: (d) => this.isToday(d), blocked: (d) => this.isBlocked(d), 'blocked-calendar': (d) => props.isDayBlocked(d), 'blocked-out-of-range': (d) => props.isOutsideRange(d), 'highlighted-calendar': (d) => props.isDayHighlighted(d), valid: (d) => !this.isBlocked(d),
      'selected-start': (d) => this.isStartDate(d), 'selected-end': (d) => this.isEndDate(d), 'blocked-minimum-nights': (d) => this.doesNotMeetMinimumNights(d), 'selected-span': (d) => this.isInSelectedSpan(d), hovered: (d) => this.isHovered(d), 'hovered-span': (d) => this.isInHoveredSpan(d),
      'first-day-of-week': (d) => this.isFirstDayOfWeek(d), 'last-day-of-week': (d) => this.isLastDayOfWeek(d), 'after-hovered-start': (d) => this.isDayAfterHoveredStartDate(d), 'before-hovered-end': (d) => this.isDayBeforeHoveredEndDate(d),
    };
    const next = this.getStateForNewMonth(props); this.state = { hoverDate: null, ...next, disablePrev: this.shouldDisableMonthNavigation(props.minDate, next.currentMonth), disableNext: this.shouldDisableMonthNavigation(props.maxDate, next.currentMonth) };
    ['onDayMouseEnter', 'onDayMouseLeave', 'onDayClick', 'onPrevMonthClick', 'onNextMonthClick', 'onMonthChange', 'onYearChange', 'onGetNextScrollableMonths', 'onGetPrevScrollableMonths', 'getFirstFocusableDay'].forEach((name) => { this[name] = this[name].bind(this); });
  }
  componentDidMount() { this.isTouchDevice = isTouchDevice(); }
  componentDidUpdate(prevProps) {
    if (this.props.startDate !== prevProps.startDate || this.props.endDate !== prevProps.endDate || this.props.numberOfMonths !== prevProps.numberOfMonths || this.props.enableOutsideDays !== prevProps.enableOutsideDays) this.setState(this.getStateForNewMonth(this.props));
    if (this.props.isOutsideRange !== prevProps.isOutsideRange) this.modifiers['blocked-out-of-range'] = (d) => this.props.isOutsideRange(d);
    if (this.props.isDayBlocked !== prevProps.isDayBlocked) this.modifiers['blocked-calendar'] = (d) => this.props.isDayBlocked(d);
    if (this.props.isDayHighlighted !== prevProps.isDayHighlighted) this.modifiers['highlighted-calendar'] = (d) => this.props.isDayHighlighted(d);
    this.today = DateTime.local();
  }
  isDisabled() { return this.props.disabled === true || this.props.disabled === START_DATE || this.props.disabled === END_DATE; }
  onDayClick(day, event) {
    event?.preventDefault(); if (this.isBlocked(day)) return;
    const { focusedInput, startDate, endDate, minimumNights, keepOpenOnDateSelect } = this.props;
    let nextStart = startDate; let nextEnd = endDate; let nextFocus = focusedInput;
    if (focusedInput === START_DATE || !focusedInput) { nextStart = day; nextEnd = null; nextFocus = END_DATE; }
    else if (focusedInput === END_DATE) {
      if (startDate && compareDates(day, startDate) < 0) { nextStart = day; nextEnd = startDate; }
      else if (startDate && compareDates(day, startDate.plus({ days: minimumNights })) >= 0) { nextEnd = day; }
      else return;
      nextFocus = keepOpenOnDateSelect ? END_DATE : null;
    }
    this.props.onDatesChange({ startDate: nextStart, endDate: nextEnd });
    this.props.onFocusChange(nextFocus);
    if (!keepOpenOnDateSelect && nextEnd) this.props.onClose({ startDate: nextStart, endDate: nextEnd });
  }
  onDayMouseEnter(day) { if (!this.isTouchDevice) this.setState(({ visibleDays, hoverDate }) => ({ hoverDate: day, visibleDays: { ...visibleDays, ...this.addModifier(this.deleteModifier({}, hoverDate, 'hovered'), day, 'hovered') } })); }
  onDayMouseLeave() { if (!this.isTouchDevice) this.setState(({ visibleDays }) => ({ hoverDate: null, visibleDays: this.getModifiers(this.getVisibleDaysForState()) || visibleDays })); }
  onPrevMonthClick() { this.changeMonth(-1, this.props.onPrevMonthClick); }
  onNextMonthClick() { this.changeMonth(1, this.props.onNextMonthClick); }
  changeMonth(amount, callback) { const month = this.state.currentMonth.plus({ months: amount }); this.setState({ currentMonth: month, disablePrev: this.shouldDisableMonthNavigation(this.props.minDate, month), disableNext: this.shouldDisableMonthNavigation(this.props.maxDate, month), visibleDays: this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays)) }, () => callback(month)); }
  onMonthChange(month) { this.setMonth(month); }
  onYearChange(month) { this.setMonth(month); }
  setMonth(month) { this.setState({ currentMonth: month, visibleDays: this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, this.props.orientation === VERTICAL_SCROLLABLE)) }); }
  onGetNextScrollableMonths() { const month = this.state.currentMonth.plus({ months: Object.keys(this.state.visibleDays).length }); this.setState(({ visibleDays }) => ({ visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } })); }
  onGetPrevScrollableMonths() { const month = this.state.currentMonth.minus({ months: this.props.numberOfMonths }); this.setState(({ visibleDays }) => ({ currentMonth: month, visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } })); }
  getFirstDayOfWeek() { return this.props.firstDayOfWeek == null ? 1 : this.props.firstDayOfWeek; }
  getFirstFocusableDay(month) { const { startDate, endDate, focusedInput, numberOfMonths } = this.props; let day = focusedInput === END_DATE ? (endDate || startDate || month.startOf('month')) : (startDate || month.startOf('month')); if (this.isBlocked(day)) { const end = month.plus({ months: numberOfMonths - 1 }).endOf('month'); while (day && compareDates(day, end) <= 0) { day = day.plus({ days: 1 }); if (!this.isBlocked(day)) break; } } return day; }
  getModifiers(visibleDays) { return Object.keys(visibleDays).reduce((result, month) => ({ ...result, [month]: visibleDays[month].reduce((days, day) => ({ ...days, [toISODateString(day)]: this.getModifiersForDay(day) }), {}) }), {}); }
  getModifiersForDay(day) { return new Set(Object.keys(this.modifiers).filter((modifier) => this.modifiers[modifier](day))); }
  getVisibleDaysForState() { const zone = this.state.currentMonth.zoneName; return Object.keys(this.state.visibleDays).reduce((result, month) => ({ ...result, [month]: Object.keys(this.state.visibleDays[month]).map((day) => DateTime.fromISO(day, { zone })) }), {}); }
  getStateForNewMonth(props) { const month = (props.initialVisibleMonth || (props.startDate ? () => props.startDate : () => DateTime.local()))(); const currentMonth = month.startOf('month'); return { currentMonth, visibleDays: this.getModifiers(getVisibleDays(currentMonth, props.numberOfMonths, props.enableOutsideDays, props.orientation === VERTICAL_SCROLLABLE)) }; }
  shouldDisableMonthNavigation(date, month) { return Boolean(date && isDayVisible(date, month, this.props.numberOfMonths, this.props.enableOutsideDays)); }
  addModifier(updated, day, modifier) { return day ? addModifier(updated, day, modifier, this.props, this.state) : updated; }
  addModifierToRange(updated, start, end, modifier) { let result = updated; let cursor = start; while (cursor && end && compareDates(cursor, end) <= 0) { result = this.addModifier(result, cursor, modifier); cursor = cursor.plus({ days: 1 }); } return result; }
  deleteModifier(updated, day, modifier) { return day ? deleteModifier(updated, day, modifier, this.props, this.state) : updated; }
  deleteModifierFromRange(updated, start, end, modifier) { let result = updated; let cursor = start; while (cursor && end && compareDates(cursor, end) <= 0) { result = this.deleteModifier(result, cursor, modifier); cursor = cursor.plus({ days: 1 }); } return result; }
  isBlocked(day, blockDaysViolatingMinNights = true) { return this.props.isDayBlocked(day) || this.props.isOutsideRange(day) || (blockDaysViolatingMinNights && this.doesNotMeetMinimumNights(day)); }
  isToday(day) { return isSameDay(day, this.today); }
  isStartDate(day) { return isSameDay(day, this.props.startDate); }
  isEndDate(day) { return isSameDay(day, this.props.endDate); }
  isHovered(day) { return isSameDay(day, this.state?.hoverDate); }
  isInSelectedSpan(day) { return this.props.startDate && this.props.endDate && compareDates(day, this.props.startDate) > 0 && compareDates(day, this.props.endDate) < 0; }
  isInHoveredSpan(day) { const { startDate, endDate, hoverDate, focusedInput } = this.props; const stateHoverDate = this.state?.hoverDate; if (!hoverDate && !stateHoverDate) return false; const hover = hoverDate || stateHoverDate; const start = focusedInput === END_DATE ? startDate : hover; const end = focusedInput === END_DATE ? hover : endDate; return Boolean(start && end && compareDates(day, start) >= 0 && compareDates(day, end) <= 0); }
  doesNotMeetMinimumNights(day) { const { startDate, minimumNights } = this.props; return Boolean(startDate && !this.props.endDate && compareDates(day, startDate.plus({ days: minimumNights })) < 0); }
  doesNotMeetMinNightsForHoveredStartDate(day, hoverDate) { const nights = this.props.getMinNightsForHoverDate(hoverDate) || this.props.minimumNights; return Boolean(hoverDate && compareDates(day, hoverDate.plus({ days: nights })) < 0); }
  isDayAfterHoveredStartDate(day) { return Boolean(this.props.startDate && this.state?.hoverDate && compareDates(day, this.props.startDate) > 0 && compareDates(day, this.state.hoverDate) <= 0); }
  isFirstPossibleEndDateForHoveredStartDate(day, hoverDate) { return Boolean(hoverDate && compareDates(day, hoverDate.plus({ days: this.props.minimumNights })) === 0); }
  isLastInRange(day) { return Boolean(this.props.endDate && isSameDay(day, this.props.endDate)); }
  beforeSelectedEnd(day) { return Boolean(this.props.endDate && compareDates(day, this.props.endDate) < 0); }
  isDayBeforeHoveredEndDate(day) { return Boolean(this.props.endDate && this.state?.hoverDate && compareDates(day, this.state.hoverDate) <= 0 && compareDates(day, this.props.endDate) < 0); }
  isFirstDayOfWeek(day) { return day.weekday % 7 === this.getFirstDayOfWeek(); }
  isLastDayOfWeek(day) { return day.weekday % 7 === (this.getFirstDayOfWeek() + 6) % 7; }

  render() { const p = this.props; const s = this.state; return <DayPicker {...pickComponentProps(DayPicker, p)} {...formatOptions(p, {})} modifiers={s.visibleDays} initialVisibleMonth={() => s.currentMonth} hidden={!p.isFocused} disablePrev={s.disablePrev} disableNext={s.disableNext} onDayClick={this.onDayClick} onDayMouseEnter={this.onDayMouseEnter} onDayMouseLeave={this.onDayMouseLeave} onPrevMonthClick={this.onPrevMonthClick} onNextMonthClick={this.onNextMonthClick} onMonthChange={this.onMonthChange} onYearChange={this.onYearChange} onGetNextScrollableMonths={this.onGetNextScrollableMonths} onGetPrevScrollableMonths={this.onGetPrevScrollableMonths} getFirstFocusableDay={this.getFirstFocusableDay} monthFormat={p.monthFormat} weekDayFormat={p.weekDayFormat} dayAriaLabelFormat={p.dayAriaLabelFormat} />; }
}
