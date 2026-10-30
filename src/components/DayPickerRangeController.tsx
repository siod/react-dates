import React from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { DateTime } from 'luxon';
import noop from '../utils/noop.js';
import { getFirstDayOfWeek as getLocaleFirstDayOfWeek } from '../internal/date/index.js';
import { isTouchDevice } from '../internal/browser/touch.js';
import type {
  DateOffset,
  DayPickerRangeControllerProps,
} from '../types.js';

import { DayPickerPhrases } from '../defaultPhrases.js';
import compareDates from '../utils/compareDates.js';
import isSameDay from '../utils/isSameDay.js';
import isDayVisible from '../utils/isDayVisible.js';
import getVisibleDays from '../utils/getVisibleDays.js';
import type { VisibleDays } from '../utils/getVisibleDays.js';
import toISODateString from '../utils/toISODateString.js';
import { addModifier, deleteModifier } from '../utils/modifiers.js';
import type { VisibleModifiers } from '../utils/modifiers.js';
import { START_DATE, END_DATE, HORIZONTAL_ORIENTATION, VERTICAL_SCROLLABLE, DAY_SIZE, DEFAULT_MONTH_FORMAT, DEFAULT_WEEKDAY_FORMAT, DEFAULT_DAY_ARIA_FORMAT, INFO_POSITION_BOTTOM, NAV_POSITION_TOP } from '../constants.js';
import DayPicker from './DayPicker.js';
import pickComponentProps from '../internal/pickComponentProps.js';

const getSelectedDateOffset = (
  offset: DateOffset | undefined,
  day: DateTime,
  modifier: DateOffset = (value) => value,
) => (
  offset ? modifier(offset(day)) : day
);

const defaultProps = {
  startDate: null, endDate: null, minDate: null, maxDate: null, onDatesChange: noop, startDateOffset: undefined, endDateOffset: undefined,
  focusedInput: null, onFocusChange: noop, onClose: noop, keepOpenOnDateSelect: false, minimumNights: 1, disabled: false,
  isOutsideRange() { return false; }, isDayBlocked() { return false; }, isDayHighlighted() { return false; }, getMinNightsForHoverDate() { return 0; }, daysViolatingMinNightsCanBeClicked: false,
  renderMonthText: null, renderMonthElement: null, renderWeekHeaderElement: null, enableOutsideDays: false, numberOfMonths: 1, orientation: HORIZONTAL_ORIENTATION, withPortal: false, initialVisibleMonth: null, hideKeyboardShortcutsPanel: false, daySize: DAY_SIZE, noBorder: false, verticalBorderSpacing: undefined, horizontalMonthPadding: 13, transitionDuration: undefined,
  dayPickerNavigationInlineStyles: null, navPosition: NAV_POSITION_TOP, navPrev: null, navNext: null, renderNavPrevButton: null, renderNavNextButton: null, noNavButtons: false, noNavNextButton: false, noNavPrevButton: false, onPrevMonthClick: noop, onNextMonthClick: noop, onOutsideClick: noop, renderCalendarDay: undefined, renderDayContents: null, renderCalendarInfo: null, renderKeyboardShortcutsButton: undefined, renderKeyboardShortcutsPanel: undefined, calendarInfoPosition: INFO_POSITION_BOTTOM, firstDayOfWeek: null, verticalHeight: null, onBlur: noop, onEscape: undefined, isFocused: false, showKeyboardShortcuts: false, onTab: noop, onShiftTab: noop, monthFormat: DEFAULT_MONTH_FORMAT, weekDayFormat: DEFAULT_WEEKDAY_FORMAT, dayAriaLabelFormat: DEFAULT_DAY_ARIA_FORMAT, phrases: DayPickerPhrases, isRTL: false,
} satisfies DayPickerRangeControllerProps;

type OptionalUndefinedProps =
  | 'endDateOffset'
  | 'onEscape'
  | 'renderCalendarDay'
  | 'renderKeyboardShortcutsButton'
  | 'renderKeyboardShortcutsPanel'
  | 'startDateOffset'
  | 'transitionDuration'
  | 'verticalBorderSpacing';
type DefaultedProps = Exclude<keyof typeof defaultProps, OptionalUndefinedProps>;
type DayPickerRangeControllerInternalProps = DayPickerRangeControllerProps
  & Required<Pick<DayPickerRangeControllerProps, DefaultedProps>>
  & Pick<DayPickerRangeControllerProps, OptionalUndefinedProps>;

interface DateOffsetRange {
  start: DateTime;
  end: DateTime;
}

interface DayPickerRangeControllerState {
  hoverDate: DateTime | null;
  dateOffset: DateOffsetRange | null;
  currentMonth: DateTime;
  visibleDays: VisibleModifiers;
  disablePrev: boolean;
  disableNext: boolean;
}

type ModifierPredicate = (day: DateTime, hoverDate?: DateTime | null) => boolean;
type DateRangeTuple = [DateTime, DateTime];

export default class DayPickerRangeController extends React.PureComponent<
DayPickerRangeControllerProps,
DayPickerRangeControllerState
> {
  static defaultProps = defaultProps;

  declare readonly props: Readonly<DayPickerRangeControllerInternalProps>;

  private isTouchDevice: boolean;

  private today: DateTime;

  private readonly modifiers: Record<string, ModifierPredicate>;

  constructor(props: DayPickerRangeControllerProps) {
    super(props); this.isTouchDevice = isTouchDevice(); this.today = DateTime.local();
    const normalizedProps = this.props;
    this.modifiers = {
      today: (d) => this.isToday(d), blocked: (d) => this.isBlocked(d), 'blocked-calendar': (d) => normalizedProps.isDayBlocked(d), 'blocked-out-of-range': (d) => normalizedProps.isOutsideRange(d), 'highlighted-calendar': (d) => normalizedProps.isDayHighlighted(d), valid: (d) => !this.isBlocked(d),
      'selected-start': (d) => this.isStartDate(d), 'selected-end': (d) => this.isEndDate(d), 'blocked-minimum-nights': (d) => this.doesNotMeetMinimumNights(d), 'selected-span': (d) => this.isInSelectedSpan(d), 'last-in-range': (d) => this.isLastInRange(d), hovered: (d) => this.isHovered(d), 'hovered-span': (d) => this.isInHoveredSpan(d),
      'hovered-offset': (d) => this.isInHoveredSpan(d),
      'first-day-of-week': (d) => this.isFirstDayOfWeek(d), 'last-day-of-week': (d) => this.isLastDayOfWeek(d), 'after-hovered-start': (d) => this.isDayAfterHoveredStartDate(d), 'before-hovered-end': (d) => this.isDayBeforeHoveredEndDate(d),
      'hovered-start-first-possible-end': (d, hoverDate) => this.isFirstPossibleEndDateForHoveredStartDate(d, hoverDate),
      'hovered-start-blocked-minimum-nights': (d, hoverDate) => this.doesNotMeetMinNightsForHoveredStartDate(d, hoverDate),
      'no-selected-start-before-selected-end': (d) => this.beforeSelectedEnd(d) && !this.props.startDate,
      'selected-start-in-hovered-span': (d, hoverDate) => this.isStartDate(d) && Boolean(hoverDate && compareDates(hoverDate, d) > 0),
      'selected-start-no-selected-end': (d) => this.isStartDate(d) && !this.props.endDate,
      'selected-end-no-selected-start': (d) => this.isEndDate(d) && !this.props.startDate,
    };
    const next = this.getStateForNewMonth(normalizedProps); this.state = { hoverDate: null, dateOffset: null, ...next, disablePrev: this.shouldDisableMonthNavigation(normalizedProps.minDate, next.currentMonth), disableNext: this.shouldDisableMonthNavigation(normalizedProps.maxDate, next.currentMonth) };
  }
  override componentDidMount() { this.isTouchDevice = isTouchDevice(); }
  override componentDidUpdate(prevProps: DayPickerRangeControllerInternalProps) {
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
  onDayClick = (
    day: DateTime,
    event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>,
  ) => {
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
      } else if (firstAllowedEndDate && compareDates(day, firstAllowedEndDate) >= 0) {
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
  };
  onDayMouseEnter = (day: DateTime) => {
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
      if (hoverDate && previousMinNights > 0 && focusedInput === START_DATE) {
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
  };
  onDayMouseLeave = (
    day: DateTime,
    event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>,
  ) => {
    if (this.isTouchDevice) return;
    const nextElement = 'relatedTarget' in event ? event.relatedTarget : null;
    const currentPicker = event?.currentTarget?.closest?.('.DayPicker');
    const nextPicker = nextElement instanceof Element ? nextElement.closest('.DayPicker') : null;
    if (currentPicker && currentPicker === nextPicker
      && nextElement instanceof Element && nextElement.closest('.CalendarDay')) return;
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
  };
  onPrevMonthClick = () => { this.changeMonth(-1, this.props.onPrevMonthClick); };
  onNextMonthClick = () => { this.changeMonth(1, this.props.onNextMonthClick); };
  changeMonth(amount: number, callback: (month: DateTime) => void) { const month = this.state.currentMonth.plus({ months: amount }); this.setState({ currentMonth: month, disablePrev: this.shouldDisableMonthNavigation(this.props.minDate, month), disableNext: this.shouldDisableMonthNavigation(this.props.maxDate, month), visibleDays: this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays)) }, () => callback(month)); }
  onMonthChange = (month: DateTime) => { this.setMonth(month); };
  onYearChange = (month: DateTime) => { this.setMonth(month); };
  setMonth(month: DateTime) { this.setState({ currentMonth: month, visibleDays: this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, this.props.orientation === VERTICAL_SCROLLABLE)) }); }
  onGetNextScrollableMonths = () => { const month = this.state.currentMonth.plus({ months: Object.keys(this.state.visibleDays).length }); this.setState(({ visibleDays }) => ({ visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } }), this.props.onGetNextScrollableMonths); };
  onGetPrevScrollableMonths = () => { const month = this.state.currentMonth.minus({ months: this.props.numberOfMonths }); this.setState(({ visibleDays }) => ({ currentMonth: month, visibleDays: { ...visibleDays, ...this.getModifiers(getVisibleDays(month, this.props.numberOfMonths, this.props.enableOutsideDays, true)) } }), this.props.onGetPrevScrollableMonths); };
  getFirstDayOfWeek() { return this.props.firstDayOfWeek == null ? (getLocaleFirstDayOfWeek({ locale: this.state?.currentMonth?.locale || this.today.locale || undefined }) ?? 0) : this.props.firstDayOfWeek; }
  getFirstFocusableDay = (month: DateTime) => { const { startDate, endDate, focusedInput, numberOfMonths } = this.props; let day = focusedInput === END_DATE ? (endDate || startDate || month.startOf('month')) : (startDate || month.startOf('month')); if (this.isBlocked(day)) { const end = month.plus({ months: numberOfMonths - 1 }).endOf('month'); while (compareDates(day, end) <= 0) { day = day.plus({ days: 1 }); if (!this.isBlocked(day)) break; } } return day; };
  getModifiers(visibleDays: VisibleDays) { return Object.keys(visibleDays).reduce<VisibleModifiers>((result, month) => ({ ...result, [month]: visibleDays[month].reduce<VisibleModifiers[string]>((days, day) => { const dayKey = toISODateString(day); return dayKey ? { ...days, [dayKey]: this.getModifiersForDay(day) } : days; }, {}) }), {}); }
  getModifiersForDay(day: DateTime) { return new Set(Object.keys(this.modifiers).filter((modifier) => this.modifiers[modifier](day))); }
  getVisibleDaysForState() { const { locale, zoneName: zone } = this.state.currentMonth; return Object.keys(this.state.visibleDays).reduce<VisibleDays>((result, month) => ({ ...result, [month]: Object.keys(this.state.visibleDays[month]).map((day) => DateTime.fromISO(day, { zone: zone ?? undefined, locale: locale ?? undefined })).filter((day): day is DateTime<true> => day.isValid) }), {}); }
  getStateForNewMonth(props: DayPickerRangeControllerInternalProps) { const month = props.initialVisibleMonth?.() ?? props.startDate ?? DateTime.local(); const currentMonth = month.startOf('month'); return { currentMonth, visibleDays: this.getModifiers(getVisibleDays(currentMonth, props.numberOfMonths, props.enableOutsideDays, props.orientation === VERTICAL_SCROLLABLE)) }; }
  shouldDisableMonthNavigation(date: DateTime | null, month: DateTime) { return Boolean(date && isDayVisible(date, month, this.props.numberOfMonths, this.props.enableOutsideDays)); }
  addModifier(updated: VisibleModifiers, day: DateTime | null, modifier: string) { return day ? addModifier(updated, day, modifier, this.props, this.state) : updated; }
  addModifierToRange(updated: VisibleModifiers, start: DateTime | null, end: DateTime | null, modifier: string) { let result = updated; let cursor = start; while (cursor && end && compareDates(cursor, end) <= 0) { result = this.addModifier(result, cursor, modifier); cursor = cursor.plus({ days: 1 }); } return result; }
  deleteModifier(updated: VisibleModifiers, day: DateTime | null, modifier: string) { return day ? deleteModifier(updated, day, modifier, this.props, this.state) : updated; }
  deleteModifierFromRange(updated: VisibleModifiers, start: DateTime | null, end: DateTime | null, modifier: string) { let result = updated; let cursor = start; while (cursor && end && compareDates(cursor, end) <= 0) { result = this.deleteModifier(result, cursor, modifier); cursor = cursor.plus({ days: 1 }); } return result; }
  getHoveredSpanRange(hoverDate: DateTime | null): DateRangeTuple | null {
    if (!hoverDate) return null;
    const { startDate, endDate, focusedInput } = this.props;
    if (focusedInput === END_DATE && startDate && compareDates(startDate, hoverDate) <= 0) return [startDate, hoverDate];
    if (focusedInput !== END_DATE && endDate && compareDates(hoverDate, endDate) <= 0) return [hoverDate, endDate];
    return null;
  }
  getAfterHoveredStartRange(hoverDate: DateTime | null): DateRangeTuple | null {
    const { startDate } = this.props;
    return startDate && hoverDate && compareDates(startDate, hoverDate) < 0
      ? [startDate.plus({ days: 1 }), hoverDate]
      : null;
  }
  getBeforeHoveredEndRange(hoverDate: DateTime | null): DateRangeTuple | null {
    const { endDate } = this.props;
    return endDate && hoverDate && compareDates(hoverDate, endDate) < 0
      ? [hoverDate, endDate.minus({ days: 1 })]
      : null;
  }
  updateModifierRange(updated: VisibleModifiers, previousRange: DateRangeTuple | null, nextRange: DateRangeTuple | null, modifier: string) {
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
  updateHoverRangeModifiers(updated: VisibleModifiers, previousHoverDate: DateTime | null, nextHoverDate: DateTime | null) {
    let result = this.updateModifierRange(updated, this.getHoveredSpanRange(previousHoverDate), this.getHoveredSpanRange(nextHoverDate), 'hovered-span');
    result = this.updateModifierRange(result, this.getAfterHoveredStartRange(previousHoverDate), this.getAfterHoveredStartRange(nextHoverDate), 'after-hovered-start');
    return this.updateModifierRange(result, this.getBeforeHoveredEndRange(previousHoverDate), this.getBeforeHoveredEndRange(nextHoverDate), 'before-hovered-end');
  }
  isBlocked(day: DateTime, blockDaysViolatingMinNights = true) { return this.props.isDayBlocked(day) || this.props.isOutsideRange(day) || (blockDaysViolatingMinNights && this.doesNotMeetMinimumNights(day)); }
  isToday(day: DateTime) { return isSameDay(day, this.today); }
  isStartDate(day: DateTime) { return isSameDay(day, this.props.startDate); }
  isEndDate(day: DateTime) { return isSameDay(day, this.props.endDate); }
  isHovered(day: DateTime) { return isSameDay(day, this.state?.hoverDate); }
  isInSelectedSpan(day: DateTime) { return Boolean(this.props.startDate && this.props.endDate && compareDates(day, this.props.startDate) > 0 && compareDates(day, this.props.endDate) < 0); }
  isInHoveredSpan(day: DateTime) { const { startDate, endDate, hoverDate, focusedInput } = this.props; const stateHoverDate = this.state?.hoverDate; if (!hoverDate && !stateHoverDate) return false; const hover = hoverDate || stateHoverDate; const start = focusedInput === END_DATE ? startDate : hover; const end = focusedInput === END_DATE ? hover : endDate; return Boolean(start && end && compareDates(day, start) >= 0 && compareDates(day, end) <= 0); }
  doesNotMeetMinimumNights(day: DateTime) {
    const { focusedInput, isOutsideRange, minimumNights, startDate } = this.props;
    if (focusedInput !== END_DATE) return false;
    if (startDate) {
      return compareDates(day, startDate) >= 0
        && compareDates(day, startDate.plus({ days: minimumNights })) < 0;
    }
    return isOutsideRange(day.minus({ days: minimumNights }));
  }
  doesNotMeetMinNightsForHoveredStartDate(day: DateTime, hoverDate: DateTime | null = null) { const nights = hoverDate ? this.props.getMinNightsForHoverDate(hoverDate) || this.props.minimumNights : this.props.minimumNights; return Boolean(hoverDate && compareDates(day, hoverDate.plus({ days: nights })) < 0); }
  isDayAfterHoveredStartDate(day: DateTime) { return Boolean(this.props.startDate && this.state?.hoverDate && compareDates(day, this.props.startDate) > 0 && compareDates(day, this.state.hoverDate) <= 0); }
  isFirstPossibleEndDateForHoveredStartDate(day: DateTime, hoverDate: DateTime | null = null) { return Boolean(hoverDate && compareDates(day, hoverDate.plus({ days: this.props.minimumNights })) === 0); }
  isLastInRange(day: DateTime) { return Boolean(this.props.endDate && isSameDay(day, this.props.endDate)); }
  beforeSelectedEnd(day: DateTime) { return Boolean(this.props.endDate && compareDates(day, this.props.endDate) < 0); }
  isDayBeforeHoveredEndDate(day: DateTime) { return Boolean(this.props.endDate && this.state?.hoverDate && compareDates(day, this.state.hoverDate) <= 0 && compareDates(day, this.props.endDate) < 0); }
  isFirstDayOfWeek(day: DateTime) { return day.weekday % 7 === this.getFirstDayOfWeek(); }
  isLastDayOfWeek(day: DateTime) { return day.weekday % 7 === (this.getFirstDayOfWeek() + 6) % 7; }

  override render() { const p = this.props; const s = this.state; return <DayPicker {...pickComponentProps(DayPicker, p)} modifiers={s.visibleDays} initialVisibleMonth={() => s.currentMonth} hidden={!p.focusedInput} disablePrev={s.disablePrev} disableNext={s.disableNext} onDayClick={this.onDayClick} onDayMouseEnter={this.onDayMouseEnter} onDayMouseLeave={this.onDayMouseLeave} onPrevMonthClick={this.onPrevMonthClick} onNextMonthClick={this.onNextMonthClick} onMonthChange={this.onMonthChange} onYearChange={this.onYearChange} onGetNextScrollableMonths={this.onGetNextScrollableMonths} onGetPrevScrollableMonths={this.onGetPrevScrollableMonths} getFirstFocusableDay={this.getFirstFocusableDay} onBlur={p.onEscape || p.onBlur} monthFormat={p.monthFormat} weekDayFormat={p.weekDayFormat} dayAriaLabelFormat={p.dayAriaLabelFormat} />; }
}
