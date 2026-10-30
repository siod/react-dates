import type { DateTime } from 'luxon';
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';

export type DateRange = { startDate: DateTime | null; endDate: DateTime | null };
export type FocusedInput = 'startDate' | 'endDate' | null;
export type Disabled = boolean | Exclude<FocusedInput, null>;
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Modifier = string;
export type Modifiers = ReadonlySet<Modifier>;
export type DateFormat = Intl.DateTimeFormatOptions | ((date: DateTime) => string);
export type Orientation = 'horizontal' | 'vertical';
export type ScrollableOrientation = Orientation | 'verticalScrollable';
export type AnchorDirection = 'left' | 'right';
export type OpenDirection = 'down' | 'up';
export type IconPosition = 'before' | 'after';
export type CalendarInfoPosition = 'top' | 'bottom' | 'before' | 'after';
export type NavPosition = 'navPositionTop' | 'navPositionBottom';
export type DatePredicate = (day: DateTime) => boolean;
export type DayEventHandler = (
  day: DateTime,
  event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>,
) => void;
export type DayRenderer = (day: DateTime, modifiers: Modifiers) => ReactNode;
export type InitialVisibleMonth = () => DateTime;
export type DateOffset = (day: DateTime) => DateTime;

export interface NavigationButtonArguments {
  ariaLabel: string;
  disabled: boolean;
  onClick?: (event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => void;
  onKeyUp?: (event: KeyboardEvent<HTMLElement>) => void;
  onMouseUp?: (event: MouseEvent<HTMLElement>) => void;
}

export interface KeyboardShortcutsButtonArguments {
  ref: (element: HTMLButtonElement | null) => void;
  onClick: () => void;
  ariaLabel: string;
}

export interface KeyboardShortcut {
  unicode: string;
  label: string;
  action: string;
}

export interface KeyboardShortcutsPanelArguments {
  closeButtonAriaLabel: string;
  keyboardShortcuts: KeyboardShortcut[];
  onCloseButtonClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  title: string;
}

export interface DatePhraseArguments {
  date: string;
}

export type DatePhrase = (arguments_: DatePhraseArguments) => string;

export interface CalendarDayPhrases {
  chooseAvailableDate?: DatePhrase;
  dateIsUnavailable?: DatePhrase;
  dateIsSelected?: DatePhrase;
  dateIsSelectedAsStartDate?: DatePhrase;
  dateIsSelectedAsEndDate?: DatePhrase;
}

export interface DateRangePickerInputPhrases {
  focusStartDate?: string;
  clearDates?: string;
  keyboardForwardNavigationInstructions?: string;
  keyboardBackwardNavigationInstructions?: string;
}

export interface SingleDatePickerInputPhrases {
  focusDate?: string;
  clearDate?: string;
  keyboardForwardNavigationInstructions?: string;
  keyboardBackwardNavigationInstructions?: string;
}

export interface DayPickerPhrases extends CalendarDayPhrases {
  calendarLabel?: string;
  roleDescription?: string;
  jumpToPrevMonth?: string;
  jumpToNextMonth?: string;
  keyboardShortcuts?: string;
  showKeyboardShortcutsPanel?: string;
  hideKeyboardShortcutsPanel?: string;
  openThisPanel?: string;
  enterKey?: string;
  leftArrowRightArrow?: string;
  upArrowDownArrow?: string;
  pageUpPageDown?: string;
  homeEnd?: string;
  escape?: string;
  questionMark?: string;
  selectFocusedDate?: string;
  moveFocusByOneDay?: string;
  moveFocusByOneWeek?: string;
  moveFocusByOneMonth?: string;
  moveFocustoStartAndEndOfWeek?: string;
  returnFocusToInput?: string;
}

export interface DateRangePickerPhrases extends DayPickerPhrases, DateRangePickerInputPhrases {
  closeDatePicker?: string;
  chooseAvailableStartDate?: DatePhrase;
  chooseAvailableEndDate?: DatePhrase;
}

export interface SingleDatePickerPhrases extends DayPickerPhrases, SingleDatePickerInputPhrases {
  closeDatePicker?: string;
}

export interface MonthElementArguments {
  month: DateTime;
  onMonthSelect: (currentMonth: DateTime, newMonth: string | number) => void;
  onYearSelect: (currentMonth: DateTime, newYear: string | number) => void;
  isVisible: boolean;
}

export type RenderMonthText = (month: DateTime) => ReactNode;
export type RenderMonthElement = (arguments_: MonthElementArguments) => ReactNode;
export type MonthRenderer =
  | { renderMonthText?: RenderMonthText | null; renderMonthElement?: null }
  | { renderMonthText?: null; renderMonthElement?: RenderMonthElement | null };

export interface CalendarDayProps {
  day?: DateTime | null;
  daySize?: number;
  isOutsideDay?: boolean;
  modifiers?: Modifiers;
  isFocused?: boolean;
  tabIndex?: 0 | -1;
  onDayClick?: DayEventHandler;
  onDayMouseEnter?: DayEventHandler;
  onDayMouseLeave?: DayEventHandler;
  renderDayContents?: DayRenderer | null;
  ariaLabelFormat?: DateFormat;
  phrases?: CalendarDayPhrases;
}

export interface DayStyle extends CSSProperties {
  hover?: CSSProperties;
  active?: CSSProperties;
}

export interface CustomizableCalendarDayProps extends CalendarDayProps {
  defaultStyles?: DayStyle;
  outsideStyles?: DayStyle;
  todayStyles?: DayStyle;
  firstDayOfWeekStyles?: DayStyle;
  lastDayOfWeekStyles?: DayStyle;
  highlightedCalendarStyles?: DayStyle;
  blockedMinNightsStyles?: DayStyle;
  blockedCalendarStyles?: DayStyle;
  blockedOutOfRangeStyles?: DayStyle;
  hoveredSpanStyles?: DayStyle;
  selectedSpanStyles?: DayStyle;
  lastInRangeStyles?: DayStyle;
  selectedStyles?: DayStyle;
  selectedStartStyles?: DayStyle;
  selectedEndStyles?: DayStyle;
  afterHoveredStartStyles?: DayStyle;
  hoveredStartFirstPossibleEndStyles?: DayStyle;
  hoveredStartBlockedMinNightsStyles?: DayStyle;
}

export interface RenderCalendarDayArguments extends CalendarDayProps {
  day: DateTime | null;
  modifiers: Modifiers;
}

export type RenderCalendarDay = (props: RenderCalendarDayArguments) => ReactNode;

export interface CalendarMonthBaseProps {
  month?: DateTime;
  horizontalMonthPadding?: number;
  isVisible?: boolean;
  enableOutsideDays?: boolean;
  modifiers?: Record<string, Modifiers>;
  orientation?: ScrollableOrientation;
  daySize?: number;
  onDayClick?: DayEventHandler;
  onDayMouseEnter?: DayEventHandler;
  onDayMouseLeave?: DayEventHandler;
  onMonthSelect?: MonthElementArguments['onMonthSelect'];
  onYearSelect?: MonthElementArguments['onYearSelect'];
  renderCalendarDay?: RenderCalendarDay;
  renderDayContents?: DayRenderer | null;
  firstDayOfWeek?: DayOfWeek | null;
  setMonthTitleHeight?: ((height: number) => void) | null;
  verticalBorderSpacing?: number;
  focusedDate?: DateTime | null;
  isFocused?: boolean;
  monthFormat?: DateFormat;
  phrases?: CalendarDayPhrases;
  dayAriaLabelFormat?: DateFormat;
}

export type CalendarMonthProps = CalendarMonthBaseProps & MonthRenderer;

export interface CalendarMonthGridBaseProps extends Omit<CalendarMonthBaseProps, 'month' | 'modifiers' | 'onMonthSelect' | 'onYearSelect'> {
  firstVisibleMonthIndex?: number;
  initialMonth?: DateTime;
  isAnimating?: boolean;
  numberOfMonths?: number;
  modifiers?: Record<string, Record<string, Modifiers>>;
  onMonthTransitionEnd?: () => void;
  onMonthChange?: (month: DateTime) => void;
  onYearChange?: (month: DateTime) => void;
  translationValue?: number | null;
  isRTL?: boolean;
  transitionDuration?: number;
}

export type CalendarMonthGridProps = CalendarMonthGridBaseProps & MonthRenderer;

export interface DayPickerBaseProps {
  enableOutsideDays?: boolean;
  numberOfMonths?: number;
  orientation?: ScrollableOrientation;
  withPortal?: boolean;
  onOutsideClick?: (event: Event) => void;
  hidden?: boolean;
  initialVisibleMonth?: InitialVisibleMonth | null;
  firstDayOfWeek?: DayOfWeek | null;
  renderCalendarInfo?: (() => ReactNode) | null;
  calendarInfoPosition?: CalendarInfoPosition;
  hideKeyboardShortcutsPanel?: boolean;
  daySize?: number;
  isRTL?: boolean;
  verticalHeight?: number | null;
  noBorder?: boolean;
  transitionDuration?: number;
  verticalBorderSpacing?: number;
  horizontalMonthPadding?: number;
  renderKeyboardShortcutsButton?: ((arguments_: KeyboardShortcutsButtonArguments) => ReactNode) | null;
  renderKeyboardShortcutsPanel?: ((arguments_: KeyboardShortcutsPanelArguments) => ReactNode) | null;
  dayPickerNavigationInlineStyles?: CSSProperties | null;
  disablePrev?: boolean;
  disableNext?: boolean;
  navPosition?: NavPosition;
  navPrev?: ReactNode;
  navNext?: ReactNode;
  renderNavPrevButton?: ((arguments_: NavigationButtonArguments) => ReactNode) | null;
  renderNavNextButton?: ((arguments_: NavigationButtonArguments) => ReactNode) | null;
  noNavButtons?: boolean;
  noNavNextButton?: boolean;
  noNavPrevButton?: boolean;
  onPrevMonthClick?: (month: DateTime) => void;
  onNextMonthClick?: (month: DateTime) => void;
  onMonthChange?: (month: DateTime) => void;
  onYearChange?: (month: DateTime) => void;
  onGetNextScrollableMonths?: (
    event?: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>,
  ) => void;
  onGetPrevScrollableMonths?: (
    event?: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>,
  ) => void;
  renderWeekHeaderElement?: ((day: string) => ReactNode) | null;
  modifiers?: Record<string, Record<string, Modifiers>>;
  renderCalendarDay?: RenderCalendarDay;
  renderDayContents?: DayRenderer | null;
  onDayClick?: DayEventHandler;
  onDayMouseEnter?: DayEventHandler;
  onDayMouseLeave?: DayEventHandler;
  isFocused?: boolean;
  getFirstFocusableDay?: ((month: DateTime) => DateTime | null) | null;
  onBlur?: (event?: KeyboardEvent<HTMLElement>) => void;
  showKeyboardShortcuts?: boolean;
  onTab?: (event: KeyboardEvent<HTMLElement>) => void;
  onShiftTab?: () => void;
  monthFormat?: DateFormat;
  weekDayFormat?: DateFormat;
  dayAriaLabelFormat?: DateFormat;
  phrases?: DayPickerPhrases;
}

export type DayPickerProps = DayPickerBaseProps & MonthRenderer;

export interface DateRangeSelectionProps {
  startDate?: DateTime | null;
  endDate?: DateTime | null;
  onDatesChange?: (dates: DateRange) => void;
  focusedInput?: FocusedInput;
  onFocusChange?: (focusedInput: FocusedInput) => void;
  onClose?: (dates: DateRange) => void;
  startDateOffset?: DateOffset;
  endDateOffset?: DateOffset;
  minDate?: DateTime | null;
  maxDate?: DateTime | null;
  keepOpenOnDateSelect?: boolean;
  minimumNights?: number;
  disabled?: Disabled;
  isOutsideRange?: DatePredicate;
  isDayBlocked?: DatePredicate;
  isDayHighlighted?: DatePredicate;
}

export interface DayPickerRangeControllerBaseProps extends Omit<DayPickerBaseProps, 'modifiers'>, DateRangeSelectionProps {
  modifiers?: Record<string, DatePredicate>;
  hoverDate?: DateTime | null;
  getMinNightsForHoverDate?: (day: DateTime) => number;
  daysViolatingMinNightsCanBeClicked?: boolean;
  onEscape?: () => void;
}

export type DayPickerRangeControllerProps = DayPickerRangeControllerBaseProps & MonthRenderer;

export interface SingleDateSelectionProps {
  date?: DateTime | null;
  minDate?: DateTime | null;
  maxDate?: DateTime | null;
  onDateChange?: (date: DateTime | null) => void;
  allowUnselect?: boolean;
  focused?: boolean;
  onFocusChange?: (arguments_: { focused: boolean }) => void;
  onClose?: (arguments_: { date: DateTime | null }) => void;
  keepOpenOnDateSelect?: boolean;
  isOutsideRange?: DatePredicate;
  isDayBlocked?: DatePredicate;
  isDayHighlighted?: DatePredicate;
}

export type DayPickerSingleDateControllerProps = Omit<DayPickerBaseProps, 'modifiers'>
  & { modifiers?: Record<string, DatePredicate> }
  & SingleDateSelectionProps
  & MonthRenderer;

export interface InputPresentationProps {
  children?: ReactNode;
  screenReaderMessage?: string;
  showCaret?: boolean;
  showDefaultInputIcon?: boolean;
  inputIconPosition?: IconPosition;
  customInputIcon?: ReactNode;
  customCloseIcon?: ReactNode;
  noBorder?: boolean;
  block?: boolean;
  small?: boolean;
  regular?: boolean;
  verticalSpacing?: number;
  autoComplete?: string;
  required?: boolean;
  readOnly?: boolean;
  openDirection?: OpenDirection;
  isFocused?: boolean;
  isRTL?: boolean;
}

export interface DateRangePickerInputProps extends InputPresentationProps {
  startDateId?: string;
  startDatePlaceholderText?: string;
  startDateAriaLabel?: string;
  startDateTitleText?: string;
  endDateId?: string;
  endDatePlaceholderText?: string;
  endDateAriaLabel?: string;
  endDateTitleText?: string;
  onStartDateFocus?: () => void;
  onEndDateFocus?: () => void;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  onStartDateShiftTab?: () => void;
  onEndDateTab?: () => void;
  onClearDates?: () => void;
  onKeyDownArrowDown?: () => void;
  onKeyDownQuestionMark?: () => void;
  startDate?: string;
  endDate?: string;
  isStartDateFocused?: boolean;
  isEndDateFocused?: boolean;
  showClearDates?: boolean;
  disabled?: Disabled;
  customArrowIcon?: ReactNode;
  phrases?: DateRangePickerInputPhrases;
}

export interface DateRangePickerInputControllerProps extends InputPresentationProps, DateRangeSelectionProps {
  startDateId?: string;
  startDatePlaceholderText?: string;
  isStartDateFocused?: boolean;
  startDateAriaLabel?: string;
  startDateTitleText?: string;
  endDateId?: string;
  endDatePlaceholderText?: string;
  isEndDateFocused?: boolean;
  endDateAriaLabel?: string;
  endDateTitleText?: string;
  showClearDates?: boolean;
  reopenPickerOnClearDates?: boolean;
  withFullScreenPortal?: boolean;
  displayFormat?: DateFormat;
  onKeyDownArrowDown?: () => void;
  onKeyDownQuestionMark?: () => void;
  customArrowIcon?: ReactNode;
  phrases?: DateRangePickerInputPhrases;
}

export interface SingleDatePickerInputProps extends InputPresentationProps {
  id: string;
  placeholder?: string;
  ariaLabel?: string;
  titleText?: string;
  displayValue?: string;
  focused?: boolean;
  disabled?: boolean;
  showClearDate?: boolean;
  onChange?: (value: string) => void;
  onClearDate?: () => void;
  onFocus?: () => void;
  onKeyDownShiftTab?: () => void;
  onKeyDownTab?: () => void;
  onKeyDownArrowDown?: () => void;
  onKeyDownQuestionMark?: () => void;
  phrases?: SingleDatePickerInputPhrases;
}

export interface DateRangePickerBaseProps extends DateRangeSelectionProps, Omit<DayPickerBaseProps, 'onBlur'>, InputPresentationProps {
  onDatesChange: (dates: DateRange) => void;
  onFocusChange: (focusedInput: FocusedInput) => void;
  startDateId: string;
  endDateId: string;
  startDatePlaceholderText?: string;
  endDatePlaceholderText?: string;
  startDateAriaLabel?: string;
  endDateAriaLabel?: string;
  startDateTitleText?: string;
  endDateTitleText?: string;
  showClearDates?: boolean;
  customArrowIcon?: ReactNode;
  withFullScreenPortal?: boolean;
  appendToBody?: boolean;
  disableScroll?: boolean;
  anchorDirection?: AnchorDirection;
  horizontalMargin?: number;
  reopenPickerOnClearDates?: boolean;
  displayFormat?: DateFormat;
  phrases?: DateRangePickerPhrases;
}

export type DateRangePickerProps = DateRangePickerBaseProps & MonthRenderer;

export interface SingleDatePickerBaseProps extends SingleDateSelectionProps, Omit<DayPickerBaseProps, 'onBlur'>, InputPresentationProps {
  id: string;
  onDateChange: (date: DateTime | null) => void;
  onFocusChange: (arguments_: { focused: boolean }) => void;
  placeholder?: string;
  ariaLabel?: string;
  titleText?: string;
  disabled?: boolean;
  showClearDate?: boolean;
  withFullScreenPortal?: boolean;
  appendToBody?: boolean;
  disableScroll?: boolean;
  anchorDirection?: AnchorDirection;
  horizontalMargin?: number;
  reopenPickerOnClearDate?: boolean;
  displayFormat?: DateFormat;
  phrases?: SingleDatePickerPhrases;
}

export type SingleDatePickerProps = SingleDatePickerBaseProps & MonthRenderer;
