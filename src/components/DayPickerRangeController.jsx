import React from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from '../internal/propTypes';
import { dateTime, getFirstDayOfWeek as getLocaleFirstDayOfWeek } from '../internal/date';
import { isTouchDevice } from '../internal/browser/touch';

import { DayPickerPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import compareDates from '../utils/compareDates';
import isSameDay from '../utils/isSameDay';
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
const getSelectedDateOffset = (offset, day, modifier = (value) => value) => (
  offset ? modifier(offset(day)) : day
);
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
  calendarInfoPosition: CalendarInfoPositionShape, firstDayOfWeek: DayOfWeekShape, verticalHeight: nonNegativeInteger, onBlur: PropTypes.func, onEscape: PropTypes.func, isFocused: PropTypes.bool, showKeyboardShortcuts: PropTypes.bool, onTab: PropTypes.func, onShiftTab: PropTypes.func,
  monthFormat: dateFormatProp, weekDayFormat: dateFormatProp, dayAriaLabelFormat: dateFormatProp, phrases: PropTypes.shape(getPhrasePropTypes(DayPickerPhrases)), isRTL: PropTypes.bool,
});

const defaultProps = {
  startDate: null, endDate: null, minDate: null, maxDate: null, onDatesChange() {}, startDateOffset: undefined, endDateOffset: undefined,
  focusedInput: null, onFocusChange() {}, onClose() {}, keepOpenOnDateSelect: false, minimumNights: 1, disabled: false,
  isOutsideRange() { return false; }, isDayBlocked() { return false; }, isDayHighlighted() { return false; }, getMinNightsForHoverDate() { return 0; }, daysViolatingMinNightsCanBeClicked: false,
  renderMonthText: null, renderMonthElement: null, renderWeekHeaderElement: null, enableOutsideDays: false, numberOfMonths: 1, orientation: HORIZONTAL_ORIENTATION, withPortal: false, initialVisibleMonth: null, hideKeyboardShortcutsPanel: false, daySize: DAY_SIZE, noBorder: false, verticalBorderSpacing: undefined, horizontalMonthPadding: 13, transitionDuration: undefined,
  dayPickerNavigationInlineStyles: null, navPosition: NAV_POSITION_TOP, navPrev: null, navNext: null, renderNavPrevButton: null, renderNavNextButton: null, noNavButtons: false, noNavNextButton: false, noNavPrevButton: false, onPrevMonthClick() {}, onNextMonthClick() {}, onOutsideClick() {}, renderCalendarDay: undefined, renderDayContents: null, renderCalendarInfo: null, renderKeyboardShortcutsButton: undefined, renderKeyboardShortcutsPanel: undefined, calendarInfoPosition: INFO_POSITION_BOTTOM, firstDayOfWeek: null, verticalHeight: null, onBlur() {}, onEscape: undefined, isFocused: false, showKeyboardShortcuts: false, onTab() {}, onShiftTab() {}, monthFormat: DEFAULT_MONTH_FORMAT, weekDayFormat: DEFAULT_WEEKDAY_FORMAT, dayAriaLabelFormat: DEFAULT_DAY_ARIA_FORMAT, phrases: DayPickerPhrases, isRTL: false,
};

export default class DayPickerRangeController extends React.PureComponent {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props); this.isTouchDevice = isTouchDevice(); this.today = DateTime.local();
    this.modifiers = {
      today: (d) => this.isToday(d), blocked: (d) => this.isBlocked(d), 'blocked-calendar': (d) => props.isDayBlocked(d), 'blocked-out-of-range': (d) => props.isOutsideRange(d), 'highlighted-calendar': (d) => props.isDayHighlighted(d), valid: (d) => !this.isBlocked(d),
      'selected-start': (d) => this.isStartDate(d), 'selected-end': (d) => this.isEndDate(d), 'blocked-minimum-nights': (d) => this.doesNotMeetMinimumNights(d), 'selected-span': (d) => this.isInSelectedSpan(d), 'last-in-range': (d) => this.isLastInRange(d), hovered: (d) => this.isHovered(d), 'hovered-span': (d) => this.isInHoveredSpan(d),
      'hovered-offset': (d) => this.isInHoveredSpan(d),
      'first-day-of-week': (d) => this.isFirstDayOfWeek(d), 'last-day-of-week': (d) => this.isLastDayOfWeek(d), 'after-hovered-start': (d) => this.isDayAfterHoveredStartDate(d), 'before-hovered-end': (d) => this.isDayBeforeHoveredEndDate(d),
      'hovered-start-first-possible-end': (d, hoverDate) => this.isFirstPossibleEndDateForHoveredStartDate(d, hoverDate),
      'hovered-start-blocked-minimum-nights': (d, hoverDate) => this.doesNotMeetMinNightsForHoveredStartDate(d, hoverDate),
      'no-selected-start-before-selected-end': (d) => this.beforeSelectedEnd(d) && !this.props.startDate,
      'selected-start-in-hovered-span': (d, hoverDate) => this.isStartDate(d) && Boolean(hoverDate) && compareDates(hoverDate, d) > 0,
      'selected-start-no-selected-end': (d) => this.isStartDate(d) && !this.props.endDate,
      'selected-end-no-selected-start': (d) => this.isEndDate(d) && !this.props.startDate,
    };
    const next = this.getStateForNewMonth(props); this.state = { hoverDate: null, dateOffset: null, ...next, disablePrev: this.shouldDisableMonthNavigation(props.minDate, next.currentMonth), disableNext: this.shouldDisableMonthNavigation(props.maxDate, next.currentMonth) };
    ['onDayMouseEnter', 'onDayMouseLeave', 'onDayClick', 'onPrevMonthClick', 'onNextMonthClick', 'onMonthChange', 'onYearChange', 'onGetNextScrollableMonths', 'onGetPrevScrollableMonths', 'getFirstFocusableDay'].forEach((name) => { this[name] = this[name].bind(this); });
  }
  componentDidMount() { this.isTouchDevice = isTouchDevice(); }
  componentDidUpdate(prevProps) {
    const datesChanged = this.props.startDate !== prevProps.startDate
      || this.props.endDate !== prevProps.endDate;
    const layoutChanged = this.props.numberOfMonths !== prevProps.numberOfMonths
      || this.props.enableOutsideDays !== prevProps.enableOutsideDays
      || this.props.orientation !== prevProps.orientation;
    const modifierInputsChanged = datesChanged
      || this.props.minimumNights !== prevProps.minimumNights
      || this.props.getMinNightsForHoverDate !== prevProps.getMinNightsForHoverDate
      || this.props.isOutsideRange !== prevProps.isOutsideRange
      || this.props.isDayBlocked !== prevProps.isDayBlocked
      || this.props.isDayHighlighted !== prevProps.isDayHighlighted;
    if (this.props.isOutsideRange !== prevProps.isOutsideRange) this.modifiers['blocked-out-of-range'] = (d) => this.props.isOutsideRange(d);
    if (this.props.isDayBlocked !== prevProps.isDayBlocked) this.modifiers['blocked-calendar'] = (d) => this.props.isDayBlocked(d);
    if (this.props.isDayHighlighted !== prevProps.isDayHighlighted) this.modifiers['highlighted-calendar'] = (d) => this.props.isDayHighlighted(d);
    if (layoutChanged || (datesChanged && !this.props.initialVisibleMonth)) {
      this.setState(this.getStateForNewMonth(this.props));
    } else if (modifierInputsChanged) {
      this.setState({
        visibleDays: this.getModifiers(this.getVisibleDaysForState()),
      });
    }
    this.today = DateTime.local();
  }
  isDisabled() { return this.props.disabled === true || this.props.disabled === START_DATE || this.props.disabled === END_DATE; }
  onDayClick(day, event) {
    const {
      daysViolatingMinNightsCanBeClicked,
      disabled,
      endDateOffset,
      focusedInput,
      keepOpenOnDateSelect,
      minimumNights,
      onClose,
      onDatesChange,
      onFocusChange,
      startDateOffset,
    } = this.props;
    event?.preventDefault();
    if (this.isBlocked(day, !daysViolatingMinNightsCanBeClicked)) return;

    let { startDate, endDate } = this.props;
    if (startDateOffset || endDateOffset) {
      startDate = getSelectedDateOffset(startDateOffset, day);
      endDate = getSelectedDateOffset(endDateOffset, day);
      if (this.isBlocked(startDate) || this.isBlocked(endDate)) return;
      const dates = { startDate, endDate };
      onDatesChange(dates);
      if (!keepOpenOnDateSelect) {
        onFocusChange(null);
        onClose(dates);
      }
    } else if (focusedInput === START_DATE) {
      const lastAllowedStartDate = endDate?.minus({ days: minimumNights });
      const isStartDateAfterEndDate = Boolean(
        (lastAllowedStartDate && compareDates(lastAllowedStartDate, day) < 0)
        || (startDate && endDate && compareDates(startDate, endDate) > 0),
      );
      const isEndDateDisabled = disabled === END_DATE;
      if (!isEndDateDisabled || !isStartDateAfterEndDate) {
        startDate = day;
        if (isStartDateAfterEndDate) endDate = null;
      }
      const dates = { startDate, endDate };
      onDatesChange(dates);
      if (isEndDateDisabled && !isStartDateAfterEndDate) {
        onFocusChange(null);
        onClose(dates);
      } else if (!isEndDateDisabled) {
        onFocusChange(END_DATE);
      }
    } else if (focusedInput === END_DATE) {
      const firstAllowedEndDate = startDate?.plus({ days: minimumNights });
      if (!startDate) {
        endDate = day;
        onDatesChange({ startDate, endDate });
        onFocusChange(START_DATE);
      } else if (compareDates(day, firstAllowedEndDate) >= 0) {
        endDate = day;
        const dates = { startDate, endDate };
        onDatesChange(dates);
        if (!keepOpenOnDateSelect) {
          onFocusChange(null);
          onClose(dates);
        } else {
          onFocusChange(END_DATE);
        }
      } else if (daysViolatingMinNightsCanBeClicked && this.doesNotMeetMinimumNights(day)) {
        endDate = day;
        onDatesChange({ startDate, endDate });
      } else if (disabled !== START_DATE) {
        startDate = day;
        endDate = null;
        onDatesChange({ startDate, endDate });
      } else {
        onDatesChange({ startDate, endDate });
      }
    } else {
      onDatesChange({ startDate, endDate });
    }
  }
  onDayMouseEnter(day) {
    if (this.isTouchDevice) return;
    const { endDateOffset, focusedInput, getMinNightsForHoverDate, startDateOffset } = this.props;
    if (!focusedInput) return;
    const { dateOffset, hoverDate, visibleDays } = this.state;
    let updatedDays = this.deleteModifier({}, hoverDate, 'hovered');
    let nextDateOffset = null;
    if (startDateOffset || endDateOffset) {
      const start = getSelectedDateOffset(startDateOffset, day);
      const end = getSelectedDateOffset(endDateOffset, day, (value) => value.plus({ days: 1 }));
      nextDateOffset = { start, end };
      if (dateOffset?.start && dateOffset?.end) {
        updatedDays = this.deleteModifierFromRange(updatedDays, dateOffset.start, dateOffset.end, 'hovered-offset');
      }
      updatedDays = this.addModifierToRange(updatedDays, start, end, 'hovered-offset');
    } else {
      updatedDays = this.addModifier(updatedDays, day, 'hovered');
      updatedDays = this.updateHoverRangeModifiers(updatedDays, hoverDate, day);
      const previousMinNights = hoverDate && !this.isBlocked(hoverDate)
        ? getMinNightsForHoverDate(hoverDate)
        : 0;
      if (previousMinNights > 0 && focusedInput === START_DATE) {
        updatedDays = this.deleteModifierFromRange(updatedDays, hoverDate.plus({ days: 1 }), hoverDate.plus({ days: previousMinNights }), 'hovered-start-blocked-minimum-nights');
        updatedDays = this.deleteModifier(updatedDays, hoverDate.plus({ days: previousMinNights }), 'hovered-start-first-possible-end');
      }
      const minNights = !this.isBlocked(day) ? getMinNightsForHoverDate(day) : 0;
      if (minNights > 0 && focusedInput === START_DATE) {
        updatedDays = this.addModifierToRange(updatedDays, day.plus({ days: 1 }), day.plus({ days: minNights }), 'hovered-start-blocked-minimum-nights');
        updatedDays = this.addModifier(updatedDays, day.plus({ days: minNights }), 'hovered-start-first-possible-end');
      }
    }
    this.setState({
      hoverDate: day,
      dateOffset: nextDateOffset,
      visibleDays: { ...visibleDays, ...updatedDays },
    });
  }
  onDayMouseLeave(day, event) {
    if (this.isTouchDevice) return;
    const nextElement = event?.relatedTarget;
    const currentPicker = event?.currentTarget?.closest?.('.DayPicker');
    const nextPicker = nextElement?.closest?.('.DayPicker');
    if (currentPicker && currentPicker === nextPicker && nextElement.closest('.CalendarDay')) return;
    const { dateOffset, hoverDate, visibleDays } = this.state;
    let updatedDays = this.deleteModifier({}, hoverDate, 'hovered');
    if (dateOffset?.start && dateOffset?.end) {
      updatedDays = this.deleteModifierFromRange(updatedDays, dateOffset.start, dateOffset.end, 'hovered-offset');
    }
    updatedDays = this.updateHoverRangeModifiers(updatedDays, hoverDate, null);
    this.setState({
      hoverDate: null,
      dateOffset: null,
      visibleDays: { ...visibleDays, ...updatedDays },
    });
  }
  onPrevMonthClick() { this.changeMonth(-1, this.props.onPrevMonthClick); }
  onNextMonthClick() { this.changeMonth(1, this.props.onNextMonthClick); }
  changeMonth(amount, callback) { const month = this.state.currentMonth.plus({ months: amount }); this.setState({ currentMonth: month, disablePrev: this.shouldDisableMonthNavigation(this.props.minDate, month), disableNext: this.shouldDisableMonthNavigation(this.props.maxDate, month), visibleDays: this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays)) }, () => callback(month)); }
  onMonthChange(month) { this.setMonth(month); }
  onYearChange(month) { this.setMonth(month); }
  setMonth(month) { this.setState({ currentMonth: month, visibleDays: this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, this.props.orientation === VERTICAL_SCROLLABLE)) }); }
  onGetNextScrollableMonths() { const month = this.state.currentMonth.plus({ months: Object.keys(this.state.visibleDays).length }); this.setState(({ visibleDays }) => ({ visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } }), this.props.onGetNextScrollableMonths); }
  onGetPrevScrollableMonths() { const month = this.state.currentMonth.minus({ months: this.props.numberOfMonths }); this.setState(({ visibleDays }) => ({ currentMonth: month, visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } }), this.props.onGetPrevScrollableMonths); }
  getFirstDayOfWeek() { return this.props.firstDayOfWeek == null ? getLocaleFirstDayOfWeek({ locale: this.state?.currentMonth?.locale || this.today.locale }) : this.props.firstDayOfWeek; }
  getFirstFocusableDay(month) { const { startDate, endDate, focusedInput, numberOfMonths } = this.props; let day = focusedInput === END_DATE ? (endDate || startDate || month.startOf('month')) : (startDate || month.startOf('month')); if (this.isBlocked(day)) { const end = month.plus({ months: numberOfMonths - 1 }).endOf('month'); while (day && compareDates(day, end) <= 0) { day = day.plus({ days: 1 }); if (!this.isBlocked(day)) break; } } return day; }
  getModifiers(visibleDays) { return Object.keys(visibleDays).reduce((result, month) => ({ ...result, [month]: visibleDays[month].reduce((days, day) => ({ ...days, [toISODateString(day)]: this.getModifiersForDay(day) }), {}) }), {}); }
  getModifiersForDay(day) { return new Set(Object.keys(this.modifiers).filter((modifier) => this.modifiers[modifier](day))); }
  getVisibleDaysForState() { const { locale, zoneName: zone } = this.state.currentMonth; return Object.keys(this.state.visibleDays).reduce((result, month) => ({ ...result, [month]: Object.keys(this.state.visibleDays[month]).map((day) => DateTime.fromISO(day, { zone, locale })) }), {}); }
  getStateForNewMonth(props) { const month = (props.initialVisibleMonth || (props.startDate ? () => props.startDate : () => DateTime.local()))(); const currentMonth = month.startOf('month'); return { currentMonth, visibleDays: this.getModifiers(getVisibleDays(currentMonth, props.numberOfMonths, props.enableOutsideDays, props.orientation === VERTICAL_SCROLLABLE)) }; }
  shouldDisableMonthNavigation(date, month) { return Boolean(date && isDayVisible(date, month, this.props.numberOfMonths, this.props.enableOutsideDays)); }
  addModifier(updated, day, modifier) { return day ? addModifier(updated, day, modifier, this.props, this.state) : updated; }
  addModifierToRange(updated, start, end, modifier) { let result = updated; let cursor = start; while (cursor && end && compareDates(cursor, end) <= 0) { result = this.addModifier(result, cursor, modifier); cursor = cursor.plus({ days: 1 }); } return result; }
  deleteModifier(updated, day, modifier) { return day ? deleteModifier(updated, day, modifier, this.props, this.state) : updated; }
  deleteModifierFromRange(updated, start, end, modifier) { let result = updated; let cursor = start; while (cursor && end && compareDates(cursor, end) <= 0) { result = this.deleteModifier(result, cursor, modifier); cursor = cursor.plus({ days: 1 }); } return result; }
  getHoveredSpanRange(hoverDate) {
    if (!hoverDate) return null;
    const { startDate, endDate, focusedInput } = this.props;
    if (focusedInput === END_DATE && startDate && compareDates(startDate, hoverDate) <= 0) return [startDate, hoverDate];
    if (focusedInput !== END_DATE && endDate && compareDates(hoverDate, endDate) <= 0) return [hoverDate, endDate];
    return null;
  }
  getAfterHoveredStartRange(hoverDate) {
    const { startDate } = this.props;
    return startDate && hoverDate && compareDates(startDate, hoverDate) < 0
      ? [startDate.plus({ days: 1 }), hoverDate]
      : null;
  }
  getBeforeHoveredEndRange(hoverDate) {
    const { endDate } = this.props;
    return endDate && hoverDate && compareDates(hoverDate, endDate) < 0
      ? [hoverDate, endDate.minus({ days: 1 })]
      : null;
  }
  updateModifierRange(updated, previousRange, nextRange, modifier) {
    if (!previousRange) return nextRange ? this.addModifierToRange(updated, ...nextRange, modifier) : updated;
    if (!nextRange) return this.deleteModifierFromRange(updated, ...previousRange, modifier);
    const [previousStart, previousEnd] = previousRange;
    const [nextStart, nextEnd] = nextRange;
    if (compareDates(previousEnd, nextStart) < 0 || compareDates(nextEnd, previousStart) < 0) {
      return this.addModifierToRange(
        this.deleteModifierFromRange(updated, previousStart, previousEnd, modifier),
        nextStart,
        nextEnd,
        modifier,
      );
    }
    let result = updated;
    if (compareDates(previousStart, nextStart) < 0) result = this.deleteModifierFromRange(result, previousStart, nextStart.minus({ days: 1 }), modifier);
    if (compareDates(previousEnd, nextEnd) > 0) result = this.deleteModifierFromRange(result, nextEnd.plus({ days: 1 }), previousEnd, modifier);
    if (compareDates(nextStart, previousStart) < 0) result = this.addModifierToRange(result, nextStart, previousStart.minus({ days: 1 }), modifier);
    if (compareDates(nextEnd, previousEnd) > 0) result = this.addModifierToRange(result, previousEnd.plus({ days: 1 }), nextEnd, modifier);
    return result;
  }
  updateHoverRangeModifiers(updated, previousHoverDate, nextHoverDate) {
    let result = this.updateModifierRange(updated, this.getHoveredSpanRange(previousHoverDate), this.getHoveredSpanRange(nextHoverDate), 'hovered-span');
    result = this.updateModifierRange(result, this.getAfterHoveredStartRange(previousHoverDate), this.getAfterHoveredStartRange(nextHoverDate), 'after-hovered-start');
    return this.updateModifierRange(result, this.getBeforeHoveredEndRange(previousHoverDate), this.getBeforeHoveredEndRange(nextHoverDate), 'before-hovered-end');
  }
  isBlocked(day, blockDaysViolatingMinNights = true) { return this.props.isDayBlocked(day) || this.props.isOutsideRange(day) || (blockDaysViolatingMinNights && this.doesNotMeetMinimumNights(day)); }
  isToday(day) { return isSameDay(day, this.today); }
  isStartDate(day) { return isSameDay(day, this.props.startDate); }
  isEndDate(day) { return isSameDay(day, this.props.endDate); }
  isHovered(day) { return isSameDay(day, this.state?.hoverDate); }
  isInSelectedSpan(day) { return this.props.startDate && this.props.endDate && compareDates(day, this.props.startDate) > 0 && compareDates(day, this.props.endDate) < 0; }
  isInHoveredSpan(day) { const { startDate, endDate, hoverDate, focusedInput } = this.props; const stateHoverDate = this.state?.hoverDate; if (!hoverDate && !stateHoverDate) return false; const hover = hoverDate || stateHoverDate; const start = focusedInput === END_DATE ? startDate : hover; const end = focusedInput === END_DATE ? hover : endDate; return Boolean(start && end && compareDates(day, start) >= 0 && compareDates(day, end) <= 0); }
  doesNotMeetMinimumNights(day) {
    const { focusedInput, isOutsideRange, minimumNights, startDate } = this.props;
    if (focusedInput !== END_DATE) return false;
    if (startDate) {
      return compareDates(day, startDate) >= 0
        && compareDates(day, startDate.plus({ days: minimumNights })) < 0;
    }
    return isOutsideRange(day.minus({ days: minimumNights }));
  }
  doesNotMeetMinNightsForHoveredStartDate(day, hoverDate) { const nights = this.props.getMinNightsForHoverDate(hoverDate) || this.props.minimumNights; return Boolean(hoverDate && compareDates(day, hoverDate.plus({ days: nights })) < 0); }
  isDayAfterHoveredStartDate(day) { return Boolean(this.props.startDate && this.state?.hoverDate && compareDates(day, this.props.startDate) > 0 && compareDates(day, this.state.hoverDate) <= 0); }
  isFirstPossibleEndDateForHoveredStartDate(day, hoverDate) { return Boolean(hoverDate && compareDates(day, hoverDate.plus({ days: this.props.minimumNights })) === 0); }
  isLastInRange(day) { return Boolean(this.props.endDate && isSameDay(day, this.props.endDate)); }
  beforeSelectedEnd(day) { return Boolean(this.props.endDate && compareDates(day, this.props.endDate) < 0); }
  isDayBeforeHoveredEndDate(day) { return Boolean(this.props.endDate && this.state?.hoverDate && compareDates(day, this.state.hoverDate) <= 0 && compareDates(day, this.props.endDate) < 0); }
  isFirstDayOfWeek(day) { return day.weekday % 7 === this.getFirstDayOfWeek(); }
  isLastDayOfWeek(day) { return day.weekday % 7 === (this.getFirstDayOfWeek() + 6) % 7; }

  render() { const p = this.props; const s = this.state; return <DayPicker {...pickComponentProps(DayPicker, p)} modifiers={s.visibleDays} initialVisibleMonth={() => s.currentMonth} hidden={!p.focusedInput} disablePrev={s.disablePrev} disableNext={s.disableNext} onDayClick={this.onDayClick} onDayMouseEnter={this.onDayMouseEnter} onDayMouseLeave={this.onDayMouseLeave} onPrevMonthClick={this.onPrevMonthClick} onNextMonthClick={this.onNextMonthClick} onMonthChange={this.onMonthChange} onYearChange={this.onYearChange} onGetNextScrollableMonths={this.onGetNextScrollableMonths} onGetPrevScrollableMonths={this.onGetPrevScrollableMonths} getFirstFocusableDay={this.getFirstFocusableDay} onBlur={p.onEscape || p.onBlur} monthFormat={p.monthFormat} weekDayFormat={p.weekDayFormat} dayAriaLabelFormat={p.dayAriaLabelFormat} />; }
}
