import React from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';

import DayPickerRangeController from '../src/components/DayPickerRangeController';

import { dateTime } from '../src/internal/date';
import { forbidExtraProps } from '../src/internal/propTypes';
import ScrollableOrientationShape from '../src/shapes/ScrollableOrientationShape';

import { START_DATE, END_DATE, HORIZONTAL_ORIENTATION } from '../src/constants';
import isInclusivelyAfterDay from '../src/utils/isInclusivelyAfterDay';

const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
const dateFormatProp = PropTypes.oneOfType([PropTypes.object, PropTypes.func]);

const propTypes = forbidExtraProps({
  // example props for the demo
  autoFocusEndDate: PropTypes.bool,
  initialStartDate: dateTime,
  initialEndDate: dateTime,
  startDateOffset: PropTypes.func,
  endDateOffset: PropTypes.func,
  showInputs: PropTypes.bool,
  minDate: dateTime,
  maxDate: dateTime,

  keepOpenOnDateSelect: PropTypes.bool,
  minimumNights: PropTypes.number,
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([START_DATE, END_DATE])]),
  isOutsideRange: PropTypes.func,
  isDayBlocked: PropTypes.func,
  isDayHighlighted: PropTypes.func,
  daysViolatingMinNightsCanBeClicked: PropTypes.bool,

  // DayPicker props
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  verticalHeight: PropTypes.number,
  withPortal: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,
  firstDayOfWeek: PropTypes.number,
  renderCalendarInfo: PropTypes.func,
  calendarInfoPosition: PropTypes.string,
  renderMonthElement: PropTypes.func,
  renderMonthText: PropTypes.func,
  renderWeekHeaderElement: PropTypes.func,

  navPosition: PropTypes.string,
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  renderNavPrevButton: PropTypes.func,
  renderNavNextButton: PropTypes.func,
  noNavButtons: PropTypes.bool,
  noNavNextButton: PropTypes.bool,
  noNavPrevButton: PropTypes.bool,

  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,
  onOutsideClick: PropTypes.func,
  renderCalendarDay: PropTypes.func,
  renderDayContents: PropTypes.func,
  renderKeyboardShortcutsButton: PropTypes.func,
  renderKeyboardShortcutsPanel: PropTypes.func,
  hideKeyboardShortcutsPanel: PropTypes.bool,
  transitionDuration: PropTypes.number,
  noBorder: PropTypes.bool,

  // i18n
  monthFormat: dateFormatProp,

  isRTL: PropTypes.bool,
});

const defaultProps = {
  // example props for the demo
  autoFocusEndDate: false,
  initialStartDate: null,
  initialEndDate: null,
  startDateOffset: undefined,
  endDateOffset: undefined,
  showInputs: false,
  minDate: null,
  maxDate: null,

  // day presentation and interaction related props
  renderCalendarDay: undefined,
  renderDayContents: null,
  minimumNights: 1,
  disabled: false,
  isDayBlocked: () => false,
  isOutsideRange: (day) => !isInclusivelyAfterDay(day, DateTime.local()),
  isDayHighlighted: () => false,
  enableOutsideDays: false,
  daysViolatingMinNightsCanBeClicked: false,

  // calendar presentation and interaction related props
  orientation: HORIZONTAL_ORIENTATION,
  verticalHeight: undefined,
  withPortal: false,
  initialVisibleMonth: null,
  firstDayOfWeek: null,
  numberOfMonths: 2,
  onOutsideClick() {},
  keepOpenOnDateSelect: false,
  renderCalendarInfo: null,
  calendarInfoPosition: undefined,
  isRTL: false,
  renderMonthText: null,
  renderMonthElement: null,
  renderWeekHeaderElement: null,
  renderKeyboardShortcutsButton: undefined,
  renderKeyboardShortcutsPanel: undefined,
  hideKeyboardShortcutsPanel: false,
  transitionDuration: undefined,
  noBorder: false,

  // navigation related props
  navPosition: undefined,
  navPrev: null,
  navNext: null,
  renderNavPrevButton: null,
  renderNavNextButton: null,
  noNavButtons: false,
  noNavNextButton: false,
  noNavPrevButton: false,
  onPrevMonthClick() {},
  onNextMonthClick() {},

  // internationalization
  monthFormat: { month: 'long', year: 'numeric' },
};

class DayPickerRangeControllerWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
      focusedInput: props.autoFocusEndDate ? END_DATE : START_DATE,
      startDate: props.initialStartDate,
      endDate: props.initialEndDate,
    };

    this.onDatesChange = this.onDatesChange.bind(this);
    this.onFocusChange = this.onFocusChange.bind(this);
  }

  onDatesChange({ startDate, endDate }) {
    const { daysViolatingMinNightsCanBeClicked, minimumNights } = this.props;
    let doesNotMeetMinNights = false;
    if (daysViolatingMinNightsCanBeClicked && startDate && endDate) {
      const dayDiff = endDate.diff(startDate.startOf('day').set({ hour: 12 }), 'days').days;
      doesNotMeetMinNights = dayDiff < minimumNights && dayDiff >= 0;
    }
    this.setState({
      startDate,
      endDate: doesNotMeetMinNights ? null : endDate,
      errorMessage: doesNotMeetMinNights
        ? 'That day does not meet the minimum nights requirement'
        : null,
    });
  }

  onFocusChange(focusedInput) {
    this.setState({
      // Force the focusedInput to always be truthy so that dates are always selectable
      focusedInput: !focusedInput ? START_DATE : focusedInput,
    });
  }

  render() {
    const { renderCalendarInfo: renderCalendarInfoProp, showInputs } = this.props;
    const {
      errorMessage,
      focusedInput,
      startDate,
      endDate,
    } = this.state;

    const props = omit(this.props, [
      'autoFocus',
      'autoFocusEndDate',
      'initialStartDate',
      'initialEndDate',
      'showInputs',
    ]);

    const startDateString = startDate && startDate.toFormat('yyyy-MM-dd');
    const endDateString = endDate && endDate.toFormat('yyyy-MM-dd');
    const renderCalendarInfo = errorMessage ? () => <div>{errorMessage}</div> : renderCalendarInfoProp;

    return (
      <div style={{ height: '100%' }}>
        {showInputs && (
          <div style={{ marginBottom: 16 }}>
            <input type="text" name="start date" value={startDateString || ''} readOnly />
            <input type="text" name="end date" value={endDateString || ''} readOnly />
          </div>
        )}

        <DayPickerRangeController
          {...props}
          onDatesChange={this.onDatesChange}
          onFocusChange={this.onFocusChange}
          focusedInput={focusedInput}
          startDate={startDate}
          endDate={endDate}
          renderCalendarInfo={renderCalendarInfo}
        />
      </div>
    );
  }
}

DayPickerRangeControllerWrapper.propTypes = propTypes;
DayPickerRangeControllerWrapper.defaultProps = defaultProps;

export default DayPickerRangeControllerWrapper;
