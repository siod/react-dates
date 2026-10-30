import React from 'react';
import { DateTime } from 'luxon';
import noop from '../utils/noop.js';
import { withStyles } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import { subscribe } from '../internal/browser/subscribe.js';
import { isTransitionEndSupported } from '../internal/browser/transitionEnd.js';
import type { CalendarMonthGridProps, Modifiers } from '../types.js';

import { CalendarDayPhrases } from '../defaultPhrases.js';
import noflip from '../utils/noflip.js';

import CalendarMonth from './CalendarMonth.js';

import getTransformStyles from '../utils/getTransformStyles.js';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth.js';
import toISOMonthString from '../utils/toISOMonthString.js';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
} from '../constants.js';

const TRANSITION_DELAY = 100;
const TRANSITION_FALLBACK_BUFFER = 50;

const emptyModifiers: Record<string, Record<string, Modifiers>> = {};

const defaultProps = {
  enableOutsideDays: false,
  firstVisibleMonthIndex: 0,
  horizontalMonthPadding: 13,
  initialMonth: DateTime.local(),
  isAnimating: false,
  numberOfMonths: 1,
  modifiers: emptyModifiers,
  orientation: HORIZONTAL_ORIENTATION,
  onDayClick: noop,
  onDayMouseEnter: noop,
  onDayMouseLeave: noop,
  onMonthChange: noop,
  onYearChange: noop,
  onMonthTransitionEnd: noop,
  renderMonthText: null,
  renderCalendarDay: undefined,
  renderDayContents: null,
  translationValue: null,
  renderMonthElement: null,
  daySize: DAY_SIZE,
  focusedDate: null,
  isFocused: false,
  firstDayOfWeek: null,
  setMonthTitleHeight: null,
  isRTL: false,
  transitionDuration: 200,
  verticalBorderSpacing: undefined,

  // i18n
  monthFormat: { month: 'long', year: 'numeric' },
  phrases: CalendarDayPhrases,
  dayAriaLabelFormat: undefined,
} satisfies CalendarMonthGridProps;

function getMonths(initialMonth: DateTime, numberOfMonths: number, withoutTransitionMonths: boolean) {
  let month = initialMonth.plus({ months: withoutTransitionMonths ? 0 : -1 });

  const months: DateTime[] = [];
  for (let i = 0; i < (withoutTransitionMonths ? numberOfMonths : numberOfMonths + 2); i += 1) {
    months.push(month);
    month = month.plus({ months: 1 });
  }

  return months;
}

type CalendarMonthGridInternalProps = CalendarMonthGridProps & WithStylesProps;

interface CalendarMonthGridState {
  months: DateTime[];
}

class CalendarMonthGrid extends React.PureComponent<
CalendarMonthGridInternalProps,
CalendarMonthGridState
> {
  static defaultProps = defaultProps;

  private readonly isTransitionEndSupported: boolean;

  private container: HTMLDivElement | null = null;

  private removeEventListener: (() => void) | null = null;

  private transitionFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  private transitionPending = false;

  constructor(props: CalendarMonthGridInternalProps) {
    super(props);
    const orientation = props.orientation ?? defaultProps.orientation;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    this.state = {
      months: getMonths(
        props.initialMonth ?? defaultProps.initialMonth,
        props.numberOfMonths ?? defaultProps.numberOfMonths,
        withoutTransitionMonths,
      ),
    };

    this.isTransitionEndSupported = isTransitionEndSupported();
  }

  override componentDidMount() {
    this.removeEventListener = subscribe(
      this.container,
      'transitionend',
      this.onTransitionEnd,
    );

    if (this.props.isAnimating) this.startTransition();
  }

  override componentDidUpdate(prevProps: CalendarMonthGridInternalProps) {
    if (this.props.initialMonth !== prevProps.initialMonth
      || this.props.numberOfMonths !== prevProps.numberOfMonths
      || this.props.orientation !== prevProps.orientation) {
      const orientation = this.props.orientation ?? defaultProps.orientation;
      const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
      this.setState({
        months: getMonths(
          this.props.initialMonth ?? defaultProps.initialMonth,
          this.props.numberOfMonths ?? defaultProps.numberOfMonths,
          withoutTransitionMonths,
        ),
      });
    }

    const { isAnimating } = this.props;
    if (isAnimating && !prevProps.isAnimating) this.startTransition();
    if (!isAnimating && prevProps.isAnimating) this.clearTransitionFallback();
  }

  override componentWillUnmount() {
    this.clearTransitionFallback();
    if (this.removeEventListener) this.removeEventListener();
  }

  onTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.container) return;
    if (event.propertyName && event.propertyName !== 'transform') return;
    this.finishTransition();
  };

  startTransition() {
    const transitionDuration = this.props.transitionDuration ?? defaultProps.transitionDuration;
    this.clearTransitionFallback();
    this.transitionPending = true;

    if (!this.isTransitionEndSupported || !transitionDuration) {
      this.finishTransition();
      return;
    }

    this.transitionFallbackTimer = setTimeout(
      this.finishTransition,
      transitionDuration + TRANSITION_DELAY + TRANSITION_FALLBACK_BUFFER,
    );
  }

  clearTransitionFallback() {
    if (this.transitionFallbackTimer) clearTimeout(this.transitionFallbackTimer);
    this.transitionFallbackTimer = null;
    this.transitionPending = false;
  }

  finishTransition = () => {
    if (!this.transitionPending) return;
    this.clearTransitionFallback();
    const onMonthTransitionEnd = this.props.onMonthTransitionEnd
      ?? defaultProps.onMonthTransitionEnd;
    onMonthTransitionEnd();
  };

  onMonthSelect = (currentMonth: DateTime, newMonthVal: string | number) => {
    const onMonthChange = this.props.onMonthChange ?? defaultProps.onMonthChange;
    const orientation = this.props.orientation ?? defaultProps.orientation;
    const { months } = this.state;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    let initialMonthSubtraction = months.indexOf(currentMonth);
    if (!withoutTransitionMonths) {
      initialMonthSubtraction -= 1;
    }
    const monthValue = Number(newMonthVal) >= 0 && Number(newMonthVal) <= 11
      ? Number(newMonthVal) + 1 : Number(newMonthVal);
    const newMonth = currentMonth
      .set({ month: monthValue })
      .minus({ months: initialMonthSubtraction });
    onMonthChange(newMonth);
  };

  onYearSelect = (currentMonth: DateTime, newYearVal: string | number) => {
    const onYearChange = this.props.onYearChange ?? defaultProps.onYearChange;
    const orientation = this.props.orientation ?? defaultProps.orientation;
    const { months } = this.state;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    let initialMonthSubtraction = months.indexOf(currentMonth);
    if (!withoutTransitionMonths) {
      initialMonthSubtraction -= 1;
    }
    const newMonth = currentMonth
      .set({ year: Number(newYearVal) })
      .minus({ months: initialMonthSubtraction });
    onYearChange(newMonth);
  };

  setContainerRef = (ref: HTMLDivElement | null) => {
    this.container = ref;
  };

  override render() {
    const {
      enableOutsideDays = defaultProps.enableOutsideDays,
      firstVisibleMonthIndex = defaultProps.firstVisibleMonthIndex,
      horizontalMonthPadding = defaultProps.horizontalMonthPadding,
      isAnimating = defaultProps.isAnimating,
      modifiers = defaultProps.modifiers,
      numberOfMonths = defaultProps.numberOfMonths,
      monthFormat = defaultProps.monthFormat,
      orientation = defaultProps.orientation,
      translationValue = defaultProps.translationValue,
      daySize = defaultProps.daySize,
      onDayMouseEnter = defaultProps.onDayMouseEnter,
      onDayMouseLeave = defaultProps.onDayMouseLeave,
      onDayClick = defaultProps.onDayClick,
      renderMonthText = defaultProps.renderMonthText,
      renderCalendarDay = defaultProps.renderCalendarDay,
      renderDayContents = defaultProps.renderDayContents,
      renderMonthElement = defaultProps.renderMonthElement,
      firstDayOfWeek = defaultProps.firstDayOfWeek,
      focusedDate = defaultProps.focusedDate,
      isFocused = defaultProps.isFocused,
      isRTL = defaultProps.isRTL,
      css,
      styles,
      phrases = defaultProps.phrases,
      dayAriaLabelFormat = defaultProps.dayAriaLabelFormat,
      transitionDuration = defaultProps.transitionDuration,
      verticalBorderSpacing = defaultProps.verticalBorderSpacing,
      setMonthTitleHeight = defaultProps.setMonthTitleHeight,
    } = this.props;

    const { months } = this.state;
    const isVertical = orientation === VERTICAL_ORIENTATION;
    const isVerticalScrollable = orientation === VERTICAL_SCROLLABLE;
    const isHorizontal = orientation === HORIZONTAL_ORIENTATION;

    const calendarMonthWidth = getCalendarMonthWidth(
      daySize,
      horizontalMonthPadding,
    );

    const width = isVertical || isVerticalScrollable
      ? calendarMonthWidth
      : (numberOfMonths + 2) * calendarMonthWidth;

    const transformType = (isVertical || isVerticalScrollable) ? 'translateY' : 'translateX';
    const transformValue = `${transformType}(${translationValue}px)`;

    return (
      <div
        {...css(
          styles.CalendarMonthGrid,
          isHorizontal && styles.CalendarMonthGrid__horizontal,
          isVertical && styles.CalendarMonthGrid__vertical,
          isVerticalScrollable && styles.CalendarMonthGrid__vertical_scrollable,
          isAnimating && styles.CalendarMonthGrid__animating,
          isAnimating && transitionDuration ? {
            transition: `transform ${transitionDuration}ms ease-in-out ${TRANSITION_DELAY}ms`,
          } : false,
          {
            ...getTransformStyles(transformValue),
            width,
          },
        )}
        ref={this.setContainerRef}
      >
        {months.map((month, i) => {
          const isVisible = (i >= firstVisibleMonthIndex)
            && (i < firstVisibleMonthIndex + numberOfMonths);
          const hideForAnimation = i === 0 && !isVisible;
          const showForAnimation = i === 0 && isAnimating && isVisible;
          const monthString = toISOMonthString(month);
          const monthModifiers = monthString ? modifiers[monthString] : undefined;
          return (
            <div
              key={monthString ?? month.toMillis()}
              {...css(
                isHorizontal && styles.CalendarMonthGrid_month__horizontal,
                hideForAnimation && styles.CalendarMonthGrid_month__hideForAnimation,
                showForAnimation && !isVertical && !isRTL && {
                  position: 'absolute',
                  left: -calendarMonthWidth,
                },
                showForAnimation && !isVertical && isRTL && {
                  position: 'absolute',
                  right: 0,
                },
                showForAnimation && isVertical && {
                  position: 'absolute',
                  top: -(translationValue ?? 0),
                },
                !isVisible && !isAnimating && styles.CalendarMonthGrid_month__hidden,
              )}
            >
              <CalendarMonth
                month={month}
                isVisible={isVisible}
                enableOutsideDays={enableOutsideDays}
                modifiers={monthModifiers}
                monthFormat={monthFormat}
                orientation={orientation}
                onDayMouseEnter={onDayMouseEnter}
                onDayMouseLeave={onDayMouseLeave}
                onDayClick={onDayClick}
                onMonthSelect={this.onMonthSelect}
                onYearSelect={this.onYearSelect}
                renderCalendarDay={renderCalendarDay}
                renderDayContents={renderDayContents}
                {...(renderMonthElement ? { renderMonthElement } : { renderMonthText })}
                firstDayOfWeek={firstDayOfWeek}
                daySize={daySize}
                focusedDate={isVisible ? focusedDate : null}
                isFocused={isFocused}
                phrases={phrases}
                setMonthTitleHeight={setMonthTitleHeight}
                dayAriaLabelFormat={dayAriaLabelFormat}
                verticalBorderSpacing={verticalBorderSpacing}
                horizontalMonthPadding={horizontalMonthPadding}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default withStyles(({
  reactDates: {
    color,
    spacing,
    zIndex,
  },
}) => ({
  CalendarMonthGrid: {
    background: color.background,
    textAlign: noflip('left'),
    zIndex,
  },

  CalendarMonthGrid__animating: {
    zIndex: zIndex + 1,
  },

  CalendarMonthGrid__horizontal: {
    position: 'absolute',
    left: noflip(spacing.dayPickerHorizontalPadding),
  },

  CalendarMonthGrid__vertical: {
    margin: '0 auto',
  },

  CalendarMonthGrid__vertical_scrollable: {
    margin: '0 auto',
  },

  CalendarMonthGrid_month__horizontal: {
    display: 'inline-block',
    verticalAlign: 'top',
    minHeight: '100%',
  },

  CalendarMonthGrid_month__hideForAnimation: {
    position: 'absolute',
    zIndex: zIndex - 1,
    opacity: 0,
    pointerEvents: 'none',
  },

  CalendarMonthGrid_month__hidden: {
    visibility: 'hidden',
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CalendarMonthGrid);
