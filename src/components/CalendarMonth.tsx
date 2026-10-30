/* eslint react/no-array-index-key: 0 */

import React from 'react';
import { DateTime } from 'luxon';
import noop from '../utils/noop.js';
import { withStyles } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import { formatDate } from '../internal/date/index.js';
import type {
  CalendarMonthProps,
  Modifiers,
} from '../types.js';

import { CalendarDayPhrases } from '../defaultPhrases.js';

import CalendarWeek from './CalendarWeek.js';
import CalendarDay from './CalendarDay.js';

import calculateDimension from '../utils/calculateDimension.js';
import getMonthWeeks from '../utils/getCalendarMonthWeeks.js';
import type { CalendarWeek as CalendarWeekType } from '../utils/getCalendarMonthWeeks.js';
import isSameDay from '../utils/isSameDay.js';
import toISODateString from '../utils/toISODateString.js';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
  DAY_SIZE,
} from '../constants.js';

const emptyModifiers: Record<string, Modifiers> = {};

const defaultProps = {
  month: DateTime.local(),
  horizontalMonthPadding: 13,
  isVisible: true,
  enableOutsideDays: false,
  modifiers: emptyModifiers,
  orientation: HORIZONTAL_ORIENTATION,
  daySize: DAY_SIZE,
  onDayClick: noop,
  onDayMouseEnter: noop,
  onDayMouseLeave: noop,
  onMonthSelect: noop,
  onYearSelect: noop,
  renderMonthText: null,
  renderCalendarDay: (props) => (<CalendarDay {...props} />),
  renderDayContents: null,
  renderMonthElement: null,
  firstDayOfWeek: null,
  setMonthTitleHeight: null,

  focusedDate: null,
  isFocused: false,

  // i18n
  monthFormat: { month: 'long', year: 'numeric' },
  phrases: CalendarDayPhrases,
  dayAriaLabelFormat: undefined,
  verticalBorderSpacing: undefined,
} satisfies CalendarMonthProps;

type CalendarMonthInternalProps = CalendarMonthProps & WithStylesProps;

interface CalendarMonthState {
  weeks: CalendarWeekType[];
}

class CalendarMonth extends React.PureComponent<CalendarMonthInternalProps, CalendarMonthState> {
  static defaultProps = defaultProps;

  private captionRef: HTMLDivElement | null = null;

  private setMonthTitleHeightTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: CalendarMonthInternalProps) {
    super(props);

    this.state = {
      weeks: getMonthWeeks(props.month ?? defaultProps.month, {
        enableOutsideDays: props.enableOutsideDays ?? defaultProps.enableOutsideDays,
        firstDayOfWeek: props.firstDayOfWeek ?? defaultProps.firstDayOfWeek,
      }),
    };

  }

  override componentDidMount() {
    this.queueSetMonthTitleHeight();
  }

  override componentDidUpdate(prevProps: CalendarMonthInternalProps) {
    const {
      setMonthTitleHeight = defaultProps.setMonthTitleHeight,
      month = defaultProps.month,
      enableOutsideDays = defaultProps.enableOutsideDays,
      firstDayOfWeek = defaultProps.firstDayOfWeek,
    } = this.props;
    if (month !== prevProps.month || enableOutsideDays !== prevProps.enableOutsideDays
      || firstDayOfWeek !== prevProps.firstDayOfWeek) {
      this.setState({
        weeks: getMonthWeeks(month, {
          enableOutsideDays,
          firstDayOfWeek,
        }),
      });
    }

    if (prevProps.setMonthTitleHeight === null && setMonthTitleHeight !== null) {
      this.queueSetMonthTitleHeight();
    }
  }

  override componentWillUnmount() {
    if (this.setMonthTitleHeightTimeout) {
      clearTimeout(this.setMonthTitleHeightTimeout);
    }
  }

  setMonthTitleHeight = () => {
    const setMonthTitleHeight = this.props.setMonthTitleHeight
      ?? defaultProps.setMonthTitleHeight;
    if (setMonthTitleHeight) {
      const captionHeight = calculateDimension(this.captionRef, 'height', true, true);
      setMonthTitleHeight(captionHeight);
    }
  };

  setCaptionRef = (ref: HTMLDivElement | null) => {
    this.captionRef = ref;
  };

  queueSetMonthTitleHeight() {
    if (this.setMonthTitleHeightTimeout) clearTimeout(this.setMonthTitleHeightTimeout);
    this.setMonthTitleHeightTimeout = setTimeout(this.setMonthTitleHeight, 0);
  }

  override render() {
    const {
      dayAriaLabelFormat = defaultProps.dayAriaLabelFormat,
      daySize = defaultProps.daySize,
      focusedDate = defaultProps.focusedDate,
      horizontalMonthPadding = defaultProps.horizontalMonthPadding,
      isFocused = defaultProps.isFocused,
      isVisible = defaultProps.isVisible,
      modifiers = defaultProps.modifiers,
      month = defaultProps.month,
      monthFormat = defaultProps.monthFormat,
      onDayClick = defaultProps.onDayClick,
      onDayMouseEnter = defaultProps.onDayMouseEnter,
      onDayMouseLeave = defaultProps.onDayMouseLeave,
      onMonthSelect = defaultProps.onMonthSelect,
      onYearSelect = defaultProps.onYearSelect,
      orientation = defaultProps.orientation,
      phrases = defaultProps.phrases,
      renderCalendarDay = defaultProps.renderCalendarDay,
      renderDayContents = defaultProps.renderDayContents,
      renderMonthElement = defaultProps.renderMonthElement,
      renderMonthText = defaultProps.renderMonthText,
      css,
      styles,
      verticalBorderSpacing = defaultProps.verticalBorderSpacing,
    } = this.props;

    const { weeks } = this.state;
    const formatOptions: Intl.DateTimeFormatOptions = {};
    const monthTitle = renderMonthText
      ? renderMonthText(month)
      : typeof monthFormat === 'function'
        ? monthFormat(month)
        : formatDate(month, { ...formatOptions, ...(monthFormat || {}) });

    const verticalScrollable = orientation === VERTICAL_SCROLLABLE;

    return (
      <div
        {...css(
          styles.CalendarMonth,
          { padding: `0 ${horizontalMonthPadding}px` },
        )}
        data-visible={isVisible}
      >
        <div
          ref={this.setCaptionRef}
          {...css(
            styles.CalendarMonth_caption,
            verticalScrollable && styles.CalendarMonth_caption__verticalScrollable,
          )}
        >
          {renderMonthElement ? (
            renderMonthElement({
              month,
              onMonthSelect,
              onYearSelect,
              isVisible,
            })
          ) : (
            <strong>
              {monthTitle}
            </strong>
          )}
        </div>

        <table
          {...css(
            verticalBorderSpacing ? false : styles.CalendarMonth_table,
            verticalBorderSpacing ? styles.CalendarMonth_verticalSpacing : false,
            verticalBorderSpacing ? { borderSpacing: `0px ${verticalBorderSpacing}px` } : false,
          )}
          role="presentation"
        >
          <tbody>
            {weeks.map((week, i) => (
              <CalendarWeek key={i}>
                {week.map((day, dayOfWeek) => {
                  const dayKey = day ? toISODateString(day) : null;
                  return (
                    <React.Fragment key={dayKey ?? `empty-${dayOfWeek}`}>
                    {renderCalendarDay({
                      day,
                      daySize,
                      isOutsideDay: !day || !day.hasSame(month, 'month'),
                      tabIndex: isVisible && isSameDay(day, focusedDate) ? 0 : -1,
                      isFocused,
                      onDayMouseEnter,
                      onDayMouseLeave,
                      onDayClick,
                      renderDayContents,
                      phrases,
                      modifiers: (dayKey && modifiers[dayKey]) || new Set<string>(),
                      ariaLabelFormat: dayAriaLabelFormat,
                    })}
                    </React.Fragment>
                  );
                })}
              </CalendarWeek>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default withStyles(({ reactDates: { color, font, spacing } }) => ({
  CalendarMonth: {
    background: color.background,
    textAlign: 'center',
    verticalAlign: 'top',
    userSelect: 'none',
  },

  CalendarMonth_table: {
    borderCollapse: 'collapse',
    borderSpacing: 0,
  },

  CalendarMonth_verticalSpacing: {
    borderCollapse: 'separate',
  },

  CalendarMonth_caption: {
    color: color.text,
    fontSize: font.captionSize,
    textAlign: 'center',
    paddingTop: spacing.captionPaddingTop,
    paddingBottom: spacing.captionPaddingBottom,
    captionSide: 'initial',
  },

  CalendarMonth_caption__verticalScrollable: {
    paddingTop: 12,
    paddingBottom: 7,
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CalendarMonth);
