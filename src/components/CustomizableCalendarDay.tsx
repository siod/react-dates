import React from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { DateTime } from 'luxon';
import noop from '../utils/noop.js';
import { withStyles } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import { formatDate } from '../internal/date/index.js';
import scheduleAnimationFrame from '../internal/browser/raf.js';
import type { AnimationFrameCancel } from '../internal/browser/raf.js';
import type {
  CalendarDayPhrases as CalendarDayPhrasesType,
  CustomizableCalendarDayProps,
  DayStyle,
} from '../types.js';

import { CalendarDayPhrases } from '../defaultPhrases.js';

import { DAY_SIZE } from '../constants.js';

function getStyles(stylesObj: DayStyle | undefined, isHovered: boolean): CSSProperties | null {
  if (!stylesObj) return null;

  const { hover, ...baseStyles } = stylesObj;
  if (isHovered && hover) {
    return hover;
  }

  return baseStyles;
}

export const defaultStyles = {
  border: '1px solid var(--react-dates-border-light)',
  color: 'var(--react-dates-color-text)',
  background: 'var(--react-dates-color-background)',

  hover: {
    background: 'var(--react-dates-border-light)',
    border: '1px solid var(--react-dates-border-light)',
    color: 'inherit',
  },
};

export const outsideStyles = {
  background: 'var(--react-dates-color-outside-background)',
  border: 0,
  color: 'var(--react-dates-color-outside-color)',
};

export const highlightedCalendarStyles = {
  background: 'var(--react-dates-color-highlighted-background)',
  color: 'var(--react-dates-color-highlighted-color)',

  hover: {
    background: 'var(--react-dates-color-highlighted-background-active)',
    color: 'var(--react-dates-color-highlighted-color)',
  },
};

export const blockedMinNightsStyles = {
  background: 'var(--react-dates-color-minimum-nights-background)',
  border: '1px solid var(--react-dates-color-minimum-nights-border)',
  color: 'var(--react-dates-color-minimum-nights-color)',

  hover: {
    background: 'var(--react-dates-color-minimum-nights-background)',
    color: 'var(--react-dates-color-minimum-nights-color)',
  },
};

export const blockedCalendarStyles = {
  background: 'var(--react-dates-color-blocked-calendar-background)',
  border: '1px solid var(--react-dates-color-blocked-calendar-border)',
  color: 'var(--react-dates-color-blocked-calendar-text)',

  hover: {
    background: 'var(--react-dates-color-blocked-calendar-background)',
    border: '1px solid var(--react-dates-color-blocked-calendar-border)',
    color: 'var(--react-dates-color-blocked-calendar-text)',
  },
};

export const blockedOutOfRangeStyles = {
  background: 'var(--react-dates-color-blocked-out-of-range-background)',
  border: '1px solid var(--react-dates-color-blocked-out-of-range-border)',
  color: 'var(--react-dates-color-blocked-out-of-range-text)',

  hover: {
    background: 'var(--react-dates-color-blocked-out-of-range-background)',
    border: '1px solid var(--react-dates-color-blocked-out-of-range-border)',
    color: 'var(--react-dates-color-blocked-out-of-range-text)',
  },
};

export const hoveredSpanStyles = {
  background: 'var(--react-dates-color-hovered-span-background)',
  border: '1px double var(--react-dates-color-hovered-span-border)',
  color: 'var(--react-dates-color-hovered-span-text)',

  hover: {
    background: 'var(--react-dates-color-hovered-span-background)',
    border: '1px double var(--react-dates-color-hovered-span-border)',
    color: 'var(--react-dates-color-hovered-span-text)',
  },
};

export const selectedSpanStyles = {
  background: 'var(--react-dates-color-selected-span-background)',
  border: '1px double var(--react-dates-color-selected-span-border)',
  color: 'var(--react-dates-color-selected-span-text)',

  hover: {
    background: 'var(--react-dates-color-selected-span-background-active)',
    border: '1px double var(--react-dates-color-selected-span-border)',
    color: 'var(--react-dates-color-selected-span-text)',
  },
};

export const lastInRangeStyles = {};

export const selectedStyles = {
  background: 'var(--react-dates-color-selected-background)',
  border: '1px double var(--react-dates-color-selected-border)',
  color: 'var(--react-dates-color-selected-text)',

  hover: {
    background: 'var(--react-dates-color-selected-background)',
    border: '1px double var(--react-dates-color-selected-border)',
    color: 'var(--react-dates-color-selected-text)',
  },
};

const defaultProps = {
  day: DateTime.local(),
  daySize: DAY_SIZE,
  isOutsideDay: false,
  modifiers: new Set<string>(),
  isFocused: false,
  tabIndex: -1,
  onDayClick: noop,
  onDayMouseEnter: noop,
  onDayMouseLeave: noop,
  renderDayContents: null,
  ariaLabelFormat: { dateStyle: 'full' },

  // style defaults
  defaultStyles,
  outsideStyles,
  todayStyles: {},
  highlightedCalendarStyles,
  blockedMinNightsStyles,
  blockedCalendarStyles,
  blockedOutOfRangeStyles,
  hoveredSpanStyles,
  selectedSpanStyles,
  lastInRangeStyles,
  selectedStyles,
  selectedStartStyles: {},
  selectedEndStyles: {},
  afterHoveredStartStyles: {},
  firstDayOfWeekStyles: {},
  lastDayOfWeekStyles: {},
  hoveredStartFirstPossibleEndStyles: {},
  hoveredStartBlockedMinNightsStyles: {},

  // internationalization
  phrases: CalendarDayPhrases,
} satisfies CustomizableCalendarDayProps;

type CustomizableCalendarDayInternalProps = CustomizableCalendarDayProps & WithStylesProps;

interface CustomizableCalendarDayState {
  isHovered: boolean;
}

function getDaySettings(
  day: DateTime,
  ariaLabelFormat: NonNullable<CustomizableCalendarDayProps['ariaLabelFormat']>,
  daySize: number,
  modifiers: NonNullable<CustomizableCalendarDayProps['modifiers']>,
  phrases: CalendarDayPhrasesType,
  formatOptions: Intl.DateTimeFormatOptions,
) {
  const selected = modifiers.has('selected') || modifiers.has('selected-span')
    || modifiers.has('selected-start') || modifiers.has('selected-end');
  const hoveredSpan = !selected && (modifiers.has('hovered-span')
    || modifiers.has('after-hovered-start') || modifiers.has('before-hovered-end'));
  const date = typeof ariaLabelFormat === 'function'
    ? ariaLabelFormat(day)
    : formatDate(day, { ...formatOptions, ...(ariaLabelFormat || {}) });
  const phrase = modifiers.has('selected-start') && phrases.dateIsSelectedAsStartDate
    ? phrases.dateIsSelectedAsStartDate
    : modifiers.has('selected-end') && phrases.dateIsSelectedAsEndDate
      ? phrases.dateIsSelectedAsEndDate
      : selected && phrases.dateIsSelected
        ? phrases.dateIsSelected
        : modifiers.has('blocked') ? phrases.dateIsUnavailable : phrases.chooseAvailableDate;
  return {
    daySizeStyles: { width: daySize, height: daySize - 1 },
    useDefaultCursor: modifiers.has('blocked-minimum-nights')
      || modifiers.has('blocked-calendar') || modifiers.has('blocked-out-of-range'),
    selected,
    hoveredSpan,
    isOutsideRange: modifiers.has('blocked-out-of-range'),
    ariaLabel: phrase ? phrase({ date }) : date,
  };
}

class CustomizableCalendarDay extends React.PureComponent<
CustomizableCalendarDayInternalProps,
CustomizableCalendarDayState
> {
  static defaultProps = defaultProps;

  private buttonRef: HTMLTableCellElement | null = null;

  private cancelFocus: AnimationFrameCancel | null = null;

  constructor(props: CustomizableCalendarDayInternalProps) {
    super(props);

    this.state = {
      isHovered: false,
    };

  }

  override componentDidUpdate(prevProps: CustomizableCalendarDayInternalProps) {
    const { isFocused, tabIndex } = this.props;
    if (tabIndex === 0) {
      if (isFocused || tabIndex !== prevProps.tabIndex) {
        if (this.cancelFocus) this.cancelFocus();
        this.cancelFocus = scheduleAnimationFrame(() => {
          if (this.buttonRef) {
            this.buttonRef.focus();
          }
        });
      }
    }
  }

  override componentWillUnmount() {
    if (this.cancelFocus) this.cancelFocus();
  }

  onDayClick(day: DateTime, e: MouseEvent<HTMLElement>) {
    const onDayClick = this.props.onDayClick ?? noop;
    onDayClick(day, e);
  }

  onDayMouseEnter(day: DateTime, e: MouseEvent<HTMLElement>) {
    const onDayMouseEnter = this.props.onDayMouseEnter ?? noop;
    this.setState({ isHovered: true });
    onDayMouseEnter(day, e);
  }

  onDayMouseLeave(day: DateTime, e: MouseEvent<HTMLElement>) {
    const onDayMouseLeave = this.props.onDayMouseLeave ?? noop;
    this.setState({ isHovered: false });
    onDayMouseLeave(day, e);
  }

  onKeyDown(day: DateTime, e: KeyboardEvent<HTMLElement>) {
    const {
      onDayClick = noop,
    } = this.props;

    const { key } = e;
    if (key === 'Enter' || key === ' ') {
      onDayClick(day, e);
    }
  }

  setButtonRef = (ref: HTMLTableCellElement | null) => {
    this.buttonRef = ref;
  };

  override render() {
    const {
      day = defaultProps.day,
      ariaLabelFormat = defaultProps.ariaLabelFormat,
      daySize = defaultProps.daySize,
      isOutsideDay = defaultProps.isOutsideDay,
      modifiers = defaultProps.modifiers,
      tabIndex = defaultProps.tabIndex,
      renderDayContents = defaultProps.renderDayContents,
      css,
      styles,
      phrases = defaultProps.phrases,

      defaultStyles: defaultStylesWithHover = defaultProps.defaultStyles,
      outsideStyles: outsideStylesWithHover = defaultProps.outsideStyles,
      todayStyles: todayStylesWithHover = defaultProps.todayStyles,
      firstDayOfWeekStyles: firstDayOfWeekStylesWithHover = defaultProps.firstDayOfWeekStyles,
      lastDayOfWeekStyles: lastDayOfWeekStylesWithHover = defaultProps.lastDayOfWeekStyles,
      highlightedCalendarStyles: highlightedCalendarStylesWithHover = defaultProps.highlightedCalendarStyles,
      blockedMinNightsStyles: blockedMinNightsStylesWithHover = defaultProps.blockedMinNightsStyles,
      blockedCalendarStyles: blockedCalendarStylesWithHover = defaultProps.blockedCalendarStyles,
      blockedOutOfRangeStyles: blockedOutOfRangeStylesWithHover = defaultProps.blockedOutOfRangeStyles,
      hoveredSpanStyles: hoveredSpanStylesWithHover = defaultProps.hoveredSpanStyles,
      selectedSpanStyles: selectedSpanStylesWithHover = defaultProps.selectedSpanStyles,
      lastInRangeStyles: lastInRangeStylesWithHover = defaultProps.lastInRangeStyles,
      selectedStyles: selectedStylesWithHover = defaultProps.selectedStyles,
      selectedStartStyles: selectedStartStylesWithHover = defaultProps.selectedStartStyles,
      selectedEndStyles: selectedEndStylesWithHover = defaultProps.selectedEndStyles,
      afterHoveredStartStyles: afterHoveredStartStylesWithHover = defaultProps.afterHoveredStartStyles,
      hoveredStartFirstPossibleEndStyles: hoveredStartFirstPossibleEndStylesWithHover = defaultProps.hoveredStartFirstPossibleEndStyles,
      hoveredStartBlockedMinNightsStyles: hoveredStartBlockedMinNightsStylesWithHover = defaultProps.hoveredStartBlockedMinNightsStyles,
    } = this.props;

    const { isHovered } = this.state;

    if (!day) return <td />;

    const formatOptions: Intl.DateTimeFormatOptions = {};
    const {
      daySizeStyles,
      useDefaultCursor,
      selected,
      hoveredSpan,
      isOutsideRange,
      ariaLabel,
    } = getDaySettings(day, ariaLabelFormat, daySize, modifiers, phrases, formatOptions);

    return (
      <td
        {...css(
          styles.CalendarDay,
          useDefaultCursor && styles.CalendarDay__defaultCursor,
          daySizeStyles,
          getStyles(defaultStylesWithHover, isHovered),
          isOutsideDay && getStyles(outsideStylesWithHover, isHovered),
          modifiers.has('today') && getStyles(todayStylesWithHover, isHovered),
          modifiers.has('first-day-of-week') && getStyles(firstDayOfWeekStylesWithHover, isHovered),
          modifiers.has('last-day-of-week') && getStyles(lastDayOfWeekStylesWithHover, isHovered),
          modifiers.has('hovered-start-first-possible-end') && getStyles(hoveredStartFirstPossibleEndStylesWithHover, isHovered),
          modifiers.has('hovered-start-blocked-minimum-nights') && getStyles(hoveredStartBlockedMinNightsStylesWithHover, isHovered),
          modifiers.has('highlighted-calendar') && getStyles(highlightedCalendarStylesWithHover, isHovered),
          modifiers.has('blocked-minimum-nights') && getStyles(blockedMinNightsStylesWithHover, isHovered),
          modifiers.has('blocked-calendar') && getStyles(blockedCalendarStylesWithHover, isHovered),
          hoveredSpan && getStyles(hoveredSpanStylesWithHover, isHovered),
          modifiers.has('after-hovered-start') && getStyles(afterHoveredStartStylesWithHover, isHovered),
          modifiers.has('selected-span') && getStyles(selectedSpanStylesWithHover, isHovered),
          modifiers.has('last-in-range') && getStyles(lastInRangeStylesWithHover, isHovered),
          selected && getStyles(selectedStylesWithHover, isHovered),
          modifiers.has('selected-start') && getStyles(selectedStartStylesWithHover, isHovered),
          modifiers.has('selected-end') && getStyles(selectedEndStylesWithHover, isHovered),
          isOutsideRange && getStyles(blockedOutOfRangeStylesWithHover, isHovered),
        )}
        role="button"
        ref={this.setButtonRef}
        aria-disabled={modifiers.has('blocked')}
        aria-label={ariaLabel}
        onMouseEnter={(e) => { this.onDayMouseEnter(day, e); }}
        onMouseLeave={(e) => { this.onDayMouseLeave(day, e); }}
        onMouseUp={(e) => { e.currentTarget.blur(); }}
        onClick={(e) => { this.onDayClick(day, e); }}
        onKeyDown={(e) => { this.onKeyDown(day, e); }}
        tabIndex={tabIndex}
      >
        {renderDayContents
          ? renderDayContents(day, modifiers)
          : formatDate(day, { ...formatOptions, day: 'numeric' })}
      </td>
    );
  }
}

export { CustomizableCalendarDay as PureCustomizableCalendarDay };
export default withStyles(() => ({
  CalendarDay: {
    boxSizing: 'border-box',
    cursor: 'pointer',
    textAlign: 'center',

    ':active': {
      outline: 0,
    },
  },

  CalendarDay__defaultCursor: {
    cursor: 'default',
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CustomizableCalendarDay);
