import React from 'react';
import noop from '../utils/noop';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { forbidExtraProps, nonNegativeInteger, or } from '../internal/propTypes';
import { withStyles, withStylesPropTypes } from '../internal/styles';
import { dateTime, formatDate } from '../internal/date';
import scheduleAnimationFrame from '../internal/browser/raf';

import { CalendarDayPhrases } from '../defaultPhrases';
import getPhrasePropTypes from '../utils/getPhrasePropTypes';

import { DAY_SIZE } from '../constants';

function getStyles(stylesObj, isHovered) {
  if (!stylesObj) return null;

  const { hover, ...baseStyles } = stylesObj;
  if (isHovered && hover) {
    return hover;
  }

  return baseStyles;
}

const DayStyleShape = PropTypes.shape({
  background: PropTypes.string,
  border: or([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,

  hover: PropTypes.shape({
    background: PropTypes.string,
    border: or([PropTypes.string, PropTypes.number]),
    color: PropTypes.string,
  }),
});

const propTypes = forbidExtraProps({
  ...withStylesPropTypes,
  day: dateTime,
  daySize: nonNegativeInteger,
  isOutsideDay: PropTypes.bool,
  modifiers: PropTypes.instanceOf(Set),
  isFocused: PropTypes.bool,
  tabIndex: PropTypes.oneOf([0, -1]),
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,
  renderDayContents: PropTypes.func,
  ariaLabelFormat: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),

  // style overrides
  defaultStyles: DayStyleShape,
  outsideStyles: DayStyleShape,
  todayStyles: DayStyleShape,
  firstDayOfWeekStyles: DayStyleShape,
  lastDayOfWeekStyles: DayStyleShape,
  highlightedCalendarStyles: DayStyleShape,
  blockedMinNightsStyles: DayStyleShape,
  blockedCalendarStyles: DayStyleShape,
  blockedOutOfRangeStyles: DayStyleShape,
  hoveredSpanStyles: DayStyleShape,
  selectedSpanStyles: DayStyleShape,
  lastInRangeStyles: DayStyleShape,
  selectedStyles: DayStyleShape,
  selectedStartStyles: DayStyleShape,
  selectedEndStyles: DayStyleShape,
  afterHoveredStartStyles: DayStyleShape,
  hoveredStartFirstPossibleEndStyles: DayStyleShape,
  hoveredStartBlockedMinNightsStyles: DayStyleShape,

  // internationalization
  phrases: PropTypes.shape(getPhrasePropTypes(CalendarDayPhrases)),
});

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
  modifiers: new Set(),
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
};

function getDaySettings(day, ariaLabelFormat, daySize, modifiers, phrases, formatOptions) {
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

class CustomizableCalendarDay extends React.PureComponent {
  constructor(...args) {
    super(...args);

    this.state = {
      isHovered: false,
    };

    this.setButtonRef = this.setButtonRef.bind(this);
  }

  componentDidUpdate(prevProps) {
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

  componentWillUnmount() {
    if (this.cancelFocus) this.cancelFocus();
  }

  onDayClick(day, e) {
    const { onDayClick } = this.props;
    onDayClick(day, e);
  }

  onDayMouseEnter(day, e) {
    const { onDayMouseEnter } = this.props;
    this.setState({ isHovered: true });
    onDayMouseEnter(day, e);
  }

  onDayMouseLeave(day, e) {
    const { onDayMouseLeave } = this.props;
    this.setState({ isHovered: false });
    onDayMouseLeave(day, e);
  }

  onKeyDown(day, e) {
    const {
      onDayClick,
    } = this.props;

    const { key } = e;
    if (key === 'Enter' || key === ' ') {
      onDayClick(day, e);
    }
  }

  setButtonRef(ref) {
    this.buttonRef = ref;
  }

  render() {
    const {
      day,
      ariaLabelFormat,
      daySize,
      isOutsideDay,
      modifiers,
      tabIndex,
      renderDayContents,
      css,
      styles,
      phrases,

      defaultStyles: defaultStylesWithHover,
      outsideStyles: outsideStylesWithHover,
      todayStyles: todayStylesWithHover,
      firstDayOfWeekStyles: firstDayOfWeekStylesWithHover,
      lastDayOfWeekStyles: lastDayOfWeekStylesWithHover,
      highlightedCalendarStyles: highlightedCalendarStylesWithHover,
      blockedMinNightsStyles: blockedMinNightsStylesWithHover,
      blockedCalendarStyles: blockedCalendarStylesWithHover,
      blockedOutOfRangeStyles: blockedOutOfRangeStylesWithHover,
      hoveredSpanStyles: hoveredSpanStylesWithHover,
      selectedSpanStyles: selectedSpanStylesWithHover,
      lastInRangeStyles: lastInRangeStylesWithHover,
      selectedStyles: selectedStylesWithHover,
      selectedStartStyles: selectedStartStylesWithHover,
      selectedEndStyles: selectedEndStylesWithHover,
      afterHoveredStartStyles: afterHoveredStartStylesWithHover,
      hoveredStartFirstPossibleEndStyles: hoveredStartFirstPossibleEndStylesWithHover,
      hoveredStartBlockedMinNightsStyles: hoveredStartBlockedMinNightsStylesWithHover,
    } = this.props;

    const { isHovered } = this.state;

    if (!day) return <td />;

    const formatOptions = {};
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

CustomizableCalendarDay.propTypes = propTypes;
CustomizableCalendarDay.defaultProps = defaultProps;

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
