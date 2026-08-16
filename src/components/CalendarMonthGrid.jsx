import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps, mutuallyExclusiveProps, nonNegativeInteger } from '../internal/propTypes';
import { withStyles, withStylesPropTypes } from '../internal/styles';
import {
  addMonths,
  isoDate,
  setMonth,
  setYear,
  today,
} from '../internal/date';
import subscribe from '../internal/browser/subscribe';
import isTransitionEndSupported from '../internal/browser/transitionEnd';

import { CalendarDayPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';
import noflip from '../utils/noflip';

import CalendarMonth from './CalendarMonth';

import getTransformStyles from '../utils/getTransformStyles';
import getCalendarMonthWidth from '../utils/getCalendarMonthWidth';
import toISOMonthString from '../utils/toISOMonthString';

import ModifiersShape from '../shapes/ModifiersShape';
import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';
import DayOfWeekShape from '../shapes/DayOfWeekShape';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
} from '../constants';

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  enableOutsideDays: PropTypes.bool,
  firstVisibleMonthIndex: PropTypes.number,
  horizontalMonthPadding: nonNegativeInteger,
  initialMonth: isoDate,
  isAnimating: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  modifiers: PropTypes.objectOf(PropTypes.objectOf(ModifiersShape)),
  orientation: ScrollableOrientationShape,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,
  onMonthTransitionEnd: PropTypes.func,
  onMonthChange: PropTypes.func,
  onYearChange: PropTypes.func,
  renderMonthText: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  translationValue: PropTypes.number,
  renderMonthElement: mutuallyExclusiveProps(PropTypes.func, 'renderMonthText', 'renderMonthElement'),
  daySize: nonNegativeInteger,
  focusedDate: isoDate, // indicates focusable day
  isFocused: PropTypes.bool, // indicates whether or not to move focus to focusable day
  firstDayOfWeek: DayOfWeekShape,
  setMonthTitleHeight: PropTypes.func,
  isRTL: PropTypes.bool,
  transitionDuration: nonNegativeInteger,
  verticalBorderSpacing: nonNegativeInteger,

  // i18n
  monthFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  locale: PropTypes.string,
  calendar: PropTypes.string,
  numberingSystem: PropTypes.string,
  phrases: PropTypes.shape(getPhrasePropTypes(CalendarDayPhrases)),
  dayAriaLabelFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
});

const defaultProps = {
  enableOutsideDays: false,
  firstVisibleMonthIndex: 0,
  horizontalMonthPadding: 13,
  initialMonth: today(),
  isAnimating: false,
  numberOfMonths: 1,
  modifiers: {},
  orientation: HORIZONTAL_ORIENTATION,
  onDayClick() {},
  onDayMouseEnter() {},
  onDayMouseLeave() {},
  onMonthChange() {},
  onYearChange() {},
  onMonthTransitionEnd() {},
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
  locale: undefined,
  calendar: undefined,
  numberingSystem: undefined,
  phrases: CalendarDayPhrases,
  dayAriaLabelFormat: undefined,
};

function getMonths(initialMonth, numberOfMonths, withoutTransitionMonths) {
  let month = addMonths(initialMonth, withoutTransitionMonths ? 0 : -1);

  const months = [];
  for (let i = 0; i < (withoutTransitionMonths ? numberOfMonths : numberOfMonths + 2); i += 1) {
    months.push(month);
    month = addMonths(month, 1);
  }

  return months;
}

class CalendarMonthGrid extends React.PureComponent {
  constructor(props) {
    super(props);
    const withoutTransitionMonths = props.orientation === VERTICAL_SCROLLABLE;
    this.state = {
      months: getMonths(props.initialMonth, props.numberOfMonths, withoutTransitionMonths),
    };

    this.isTransitionEndSupported = isTransitionEndSupported();
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.setContainerRef = this.setContainerRef.bind(this);

    this.onMonthSelect = this.onMonthSelect.bind(this);
    this.onYearSelect = this.onYearSelect.bind(this);
  }

  componentDidMount() {
    this.removeEventListener = subscribe(
      this.container,
      'transitionend',
      this.onTransitionEnd,
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.initialMonth !== prevProps.initialMonth
      || this.props.numberOfMonths !== prevProps.numberOfMonths
      || this.props.orientation !== prevProps.orientation
      || this.props.locale !== prevProps.locale) {
      const withoutTransitionMonths = this.props.orientation === VERTICAL_SCROLLABLE;
      this.setState({
        months: getMonths(this.props.initialMonth, this.props.numberOfMonths, withoutTransitionMonths),
      });
    }

    const { isAnimating, transitionDuration, onMonthTransitionEnd } = this.props;
    if ((!this.isTransitionEndSupported || !transitionDuration)
      && isAnimating && !prevProps.isAnimating) onMonthTransitionEnd();
  }

  componentWillUnmount() {
    if (this.removeEventListener) this.removeEventListener();
  }

  onTransitionEnd() {
    const { onMonthTransitionEnd } = this.props;
    onMonthTransitionEnd();
  }

  onMonthSelect(currentMonth, newMonthVal) {
    const { onMonthChange, orientation } = this.props;
    const { months } = this.state;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    let initialMonthSubtraction = months.indexOf(currentMonth);
    if (!withoutTransitionMonths) {
      initialMonthSubtraction -= 1;
    }
    const monthValue = Number(newMonthVal) >= 0 && Number(newMonthVal) <= 11
      ? Number(newMonthVal) + 1 : Number(newMonthVal);
    let newMonth = setMonth(currentMonth, monthValue);
    newMonth = addMonths(newMonth, -initialMonthSubtraction);
    onMonthChange(newMonth);
  }

  onYearSelect(currentMonth, newYearVal) {
    const { onYearChange, orientation } = this.props;
    const { months } = this.state;
    const withoutTransitionMonths = orientation === VERTICAL_SCROLLABLE;
    let initialMonthSubtraction = months.indexOf(currentMonth);
    if (!withoutTransitionMonths) {
      initialMonthSubtraction -= 1;
    }
    let newMonth = setYear(currentMonth, Number(newYearVal));
    newMonth = addMonths(newMonth, -initialMonthSubtraction);
    onYearChange(newMonth);
  }

  setContainerRef(ref) {
    this.container = ref;
  }

  render() {
    const {
      enableOutsideDays,
      firstVisibleMonthIndex,
      horizontalMonthPadding,
      isAnimating,
      modifiers,
      numberOfMonths,
      monthFormat,
      orientation,
      translationValue,
      daySize,
      onDayMouseEnter,
      onDayMouseLeave,
      onDayClick,
      renderMonthText,
      renderCalendarDay,
      renderDayContents,
      renderMonthElement,
      firstDayOfWeek,
      focusedDate,
      isFocused,
      isRTL,
      css,
      styles,
      phrases,
      dayAriaLabelFormat,
      transitionDuration,
      verticalBorderSpacing,
      setMonthTitleHeight,
      locale,
      calendar,
      numberingSystem,
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
          isAnimating && transitionDuration && {
            transition: `transform ${transitionDuration}ms ease-in-out 0.1s`,
          },
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
          return (
            <div
              key={monthString}
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
                  top: -translationValue,
                },
                !isVisible && !isAnimating && styles.CalendarMonthGrid_month__hidden,
              )}
            >
              <CalendarMonth
                month={month}
                isVisible={isVisible}
                enableOutsideDays={enableOutsideDays}
                modifiers={modifiers[monthString]}
                monthFormat={monthFormat}
                orientation={orientation}
                onDayMouseEnter={onDayMouseEnter}
                onDayMouseLeave={onDayMouseLeave}
                onDayClick={onDayClick}
                onMonthSelect={this.onMonthSelect}
                onYearSelect={this.onYearSelect}
                renderMonthText={renderMonthText}
                renderCalendarDay={renderCalendarDay}
                renderDayContents={renderDayContents}
                renderMonthElement={renderMonthElement}
                firstDayOfWeek={firstDayOfWeek}
                daySize={daySize}
                focusedDate={isVisible ? focusedDate : null}
                isFocused={isFocused}
                phrases={phrases}
                setMonthTitleHeight={setMonthTitleHeight}
                dayAriaLabelFormat={dayAriaLabelFormat}
                verticalBorderSpacing={verticalBorderSpacing}
                horizontalMonthPadding={horizontalMonthPadding}
                locale={locale}
                calendar={calendar}
                numberingSystem={numberingSystem}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

CalendarMonthGrid.propTypes = propTypes;
CalendarMonthGrid.defaultProps = defaultProps;

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
