import React from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { DateTime } from 'luxon';
import noop from '../utils/noop.js';
import { withStyles } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import { formatDate } from '../internal/date/index.js';
import scheduleAnimationFrame from '../internal/browser/raf.js';
import type { AnimationFrameCancel } from '../internal/browser/raf.js';
import type { CalendarDayPhrases as CalendarDayPhrasesType, CalendarDayProps } from '../types.js';

import { CalendarDayPhrases } from '../defaultPhrases.js';

import { DAY_SIZE } from '../constants.js';

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

  // internationalization
  phrases: CalendarDayPhrases,
} satisfies CalendarDayProps;

type CalendarDayInternalProps = CalendarDayProps & WithStylesProps;

function getDaySettings(
  day: DateTime,
  ariaLabelFormat: NonNullable<CalendarDayProps['ariaLabelFormat']>,
  daySize: number,
  modifiers: NonNullable<CalendarDayProps['modifiers']>,
  phrases: CalendarDayPhrasesType,
  formatOptions: Intl.DateTimeFormatOptions,
) {
  const selected = modifiers.has('selected')
    || modifiers.has('selected-span')
    || modifiers.has('selected-start')
    || modifiers.has('selected-end');
  const hoveredSpan = !selected && (modifiers.has('hovered-span')
    || modifiers.has('after-hovered-start') || modifiers.has('before-hovered-end'));
  let date;
  if (typeof ariaLabelFormat === 'function') date = ariaLabelFormat(day);
  else date = formatDate(day, { ...formatOptions, ...(ariaLabelFormat || {}) });
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

class CalendarDay extends React.PureComponent<CalendarDayInternalProps> {
  static defaultProps = defaultProps;

  private buttonRef: HTMLTableCellElement | null = null;

  private cancelFocus: AnimationFrameCancel | null = null;

  override componentDidUpdate(prevProps: CalendarDayInternalProps) {
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
    onDayMouseEnter(day, e);
  }

  onDayMouseLeave(day: DateTime, e: MouseEvent<HTMLElement>) {
    const onDayMouseLeave = this.props.onDayMouseLeave ?? noop;
    onDayMouseLeave(day, e);
  }

  onKeyDown(day: DateTime, e: KeyboardEvent<HTMLElement>) {
    const onDayClick = this.props.onDayClick ?? noop;

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
      renderDayContents = defaultProps.renderDayContents,
      tabIndex = defaultProps.tabIndex,
      css,
      styles,
      phrases = defaultProps.phrases,
    } = this.props;

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
          styles.CalendarDay__default,
          isOutsideDay && styles.CalendarDay__outside,
          modifiers.has('today') && styles.CalendarDay__today,
          modifiers.has('first-day-of-week') && styles.CalendarDay__firstDayOfWeek,
          modifiers.has('last-day-of-week') && styles.CalendarDay__lastDayOfWeek,
          modifiers.has('hovered-offset') && styles.CalendarDay__hovered_offset,
          modifiers.has('hovered-start-first-possible-end') && styles.CalendarDay__hovered_start_first_possible_end,
          modifiers.has('hovered-start-blocked-minimum-nights') && styles.CalendarDay__hovered_start_blocked_min_nights,
          modifiers.has('highlighted-calendar') && styles.CalendarDay__highlighted_calendar,
          modifiers.has('blocked-minimum-nights') && styles.CalendarDay__blocked_minimum_nights,
          modifiers.has('blocked-calendar') && styles.CalendarDay__blocked_calendar,
          hoveredSpan && styles.CalendarDay__hovered_span,
          modifiers.has('after-hovered-start') && styles.CalendarDay__after_hovered_start,
          modifiers.has('selected-span') && styles.CalendarDay__selected_span,
          modifiers.has('selected-start') && styles.CalendarDay__selected_start,
          modifiers.has('selected-end') && styles.CalendarDay__selected_end,
          selected && !modifiers.has('selected-span') && styles.CalendarDay__selected,
          modifiers.has('before-hovered-end') && styles.CalendarDay__before_hovered_end,
          modifiers.has('no-selected-start-before-selected-end') && styles.CalendarDay__no_selected_start_before_selected_end,
          modifiers.has('selected-start-in-hovered-span') && styles.CalendarDay__selected_start_in_hovered_span,
          modifiers.has('selected-end-in-hovered-span') && styles.CalendarDay__selected_end_in_hovered_span,
          modifiers.has('selected-start-no-selected-end') && styles.CalendarDay__selected_start_no_selected_end,
          modifiers.has('selected-end-no-selected-start') && styles.CalendarDay__selected_end_no_selected_start,
          isOutsideRange && styles.CalendarDay__blocked_out_of_range,
          daySizeStyles,
        )}
        role="button"
        ref={this.setButtonRef}
        aria-disabled={modifiers.has('blocked')}
        {...(modifiers.has('today') ? { 'aria-current': 'date' } : {})}
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

export { CalendarDay as PureCalendarDay };
export default withStyles(({ reactDates: { color, font } }) => ({
  CalendarDay: {
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontSize: font.size,
    textAlign: 'center',

    ':active': {
      outline: 0,
    },
  },

  CalendarDay__defaultCursor: {
    cursor: 'default',
  },

  CalendarDay__default: {
    border: `1px solid ${color.core.borderLight}`,
    color: color.text,
    background: color.background,

    ':hover': {
      background: color.core.borderLight,
      border: `1px solid ${color.core.borderLight}`,
      color: 'inherit',
    },
  },

  CalendarDay__hovered_offset: {
    background: color.core.borderBright,
    border: `1px double ${color.core.borderLight}`,
    color: 'inherit',
  },

  CalendarDay__outside: {
    border: 0,
    background: color.outside.backgroundColor,
    color: color.outside.color,

    ':hover': {
      border: 0,
    },
  },

  CalendarDay__blocked_minimum_nights: {
    background: color.minimumNights.backgroundColor,
    border: `1px solid ${color.minimumNights.borderColor}`,
    color: color.minimumNights.color,

    ':hover': {
      background: color.minimumNights.backgroundColor_hover,
      color: color.minimumNights.color_active,
    },

    ':active': {
      background: color.minimumNights.backgroundColor_active,
      color: color.minimumNights.color_active,
    },
  },

  CalendarDay__highlighted_calendar: {
    background: color.highlighted.backgroundColor,
    color: color.highlighted.color,

    ':hover': {
      background: color.highlighted.backgroundColor_hover,
      color: color.highlighted.color_active,
    },

    ':active': {
      background: color.highlighted.backgroundColor_active,
      color: color.highlighted.color_active,
    },
  },

  CalendarDay__selected_span: {
    background: color.selectedSpan.backgroundColor,
    border: `1px double ${color.selectedSpan.borderColor}`,
    color: color.selectedSpan.color,

    ':hover': {
      background: color.selectedSpan.backgroundColor_hover,
      border: `1px double ${color.selectedSpan.borderColor}`,
      color: color.selectedSpan.color_active,
    },

    ':active': {
      background: color.selectedSpan.backgroundColor_active,
      border: `1px double ${color.selectedSpan.borderColor}`,
      color: color.selectedSpan.color_active,
    },
  },

  CalendarDay__selected: {
    background: color.selected.backgroundColor,
    border: `1px double ${color.selected.borderColor}`,
    color: color.selected.color,

    ':hover': {
      background: color.selected.backgroundColor_hover,
      border: `1px double ${color.selected.borderColor}`,
      color: color.selected.color_active,
    },

    ':active': {
      background: color.selected.backgroundColor_active,
      border: `1px double ${color.selected.borderColor}`,
      color: color.selected.color_active,
    },
  },

  CalendarDay__hovered_span: {
    background: color.hoveredSpan.backgroundColor,
    border: `1px double ${color.hoveredSpan.borderColor}`,
    color: color.hoveredSpan.color,

    ':hover': {
      background: color.hoveredSpan.backgroundColor_hover,
      border: `1px double ${color.hoveredSpan.borderColor}`,
      color: color.hoveredSpan.color_active,
    },

    ':active': {
      background: color.hoveredSpan.backgroundColor_active,
      border: `1px double ${color.hoveredSpan.borderColor}`,
      color: color.hoveredSpan.color_active,
    },
  },

  CalendarDay__blocked_calendar: {
    background: color.blocked_calendar.backgroundColor,
    border: `1px solid ${color.blocked_calendar.borderColor}`,
    color: color.blocked_calendar.color,

    ':hover': {
      background: color.blocked_calendar.backgroundColor_hover,
      border: `1px solid ${color.blocked_calendar.borderColor}`,
      color: color.blocked_calendar.color_active,
    },

    ':active': {
      background: color.blocked_calendar.backgroundColor_active,
      border: `1px solid ${color.blocked_calendar.borderColor}`,
      color: color.blocked_calendar.color_active,
    },
  },

  CalendarDay__blocked_out_of_range: {
    background: color.blocked_out_of_range.backgroundColor,
    border: `1px solid ${color.blocked_out_of_range.borderColor}`,
    color: color.blocked_out_of_range.color,

    ':hover': {
      background: color.blocked_out_of_range.backgroundColor_hover,
      border: `1px solid ${color.blocked_out_of_range.borderColor}`,
      color: color.blocked_out_of_range.color_active,
    },

    ':active': {
      background: color.blocked_out_of_range.backgroundColor_active,
      border: `1px solid ${color.blocked_out_of_range.borderColor}`,
      color: color.blocked_out_of_range.color_active,
    },
  },

  CalendarDay__hovered_start_first_possible_end: {
    background: color.core.borderLighter,
    border: `1px double ${color.core.borderLighter}`,
  },

  CalendarDay__hovered_start_blocked_min_nights: {
    background: color.core.borderLighter,
    border: `1px double ${color.core.borderLight}`,
  },

  CalendarDay__selected_start: {},
  CalendarDay__selected_end: {},
  CalendarDay__today: {},
  CalendarDay__firstDayOfWeek: {},
  CalendarDay__lastDayOfWeek: {},
  CalendarDay__after_hovered_start: {},
  CalendarDay__before_hovered_end: {},
  CalendarDay__no_selected_start_before_selected_end: {},
  CalendarDay__selected_start_in_hovered_span: {},
  CalendarDay__selected_end_in_hovered_span: {},
  CalendarDay__selected_start_no_selected_end: {},
  CalendarDay__selected_end_no_selected_start: {},
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(CalendarDay);
