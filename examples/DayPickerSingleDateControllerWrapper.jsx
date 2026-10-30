import React from 'react';
import { DateTime } from 'luxon';

import DayPickerSingleDateController from '../src/components/DayPickerSingleDateController';

import { HORIZONTAL_ORIENTATION } from '../src/constants';
import isInclusivelyAfterDay from '../src/utils/isInclusivelyAfterDay';

const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
const defaultProps = {
  // example props for the demo
  autoFocus: false,
  initialDate: null,
  showInput: false,

  // day presentation and interaction related props
  allowUnselect: false,
  renderCalendarDay: undefined,
  renderDayContents: null,
  isDayBlocked: () => false,
  isOutsideRange: (day) => !isInclusivelyAfterDay(day, DateTime.local()),
  isDayHighlighted: () => false,
  enableOutsideDays: false,
  minDate: null,
  maxDate: null,

  // calendar presentation and interaction related props
  orientation: HORIZONTAL_ORIENTATION,
  verticalHeight: null,
  withPortal: false,
  initialVisibleMonth: null,
  numberOfMonths: 2,
  onOutsideClick() {},
  keepOpenOnDateSelect: false,
  renderCalendarInfo: null,
  isRTL: false,

  // navigation related props
  navPrev: null,
  navNext: null,
  renderNavPrevButton: null,
  renderNavNextButton: null,
  onPrevMonthClick() {},
  onNextMonthClick() {},

  // internationalization
  monthFormat: { month: 'long', year: 'numeric' },
};

class DayPickerSingleDateControllerWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      focused: true,
      date: props.initialDate,
    };

    this.onDateChange = this.onDateChange.bind(this);
    this.onFocusChange = this.onFocusChange.bind(this);
  }

  onDateChange(date) {
    this.setState({ date });
  }

  onFocusChange() {
    // Force the focused states to always be truthy so that date is always selectable
    this.setState({ focused: true });
  }

  render() {
    const { showInput } = this.props;
    const { focused, date } = this.state;

    const props = omit(this.props, [
      'autoFocus',
      'initialDate',
      'showInput',
    ]);

    const dateString = date && date.toFormat('yyyy-MM-dd');

    return (
      <div>
        {showInput && (
          <div style={{ marginBottom: 16 }}>
            <input type="text" name="start date" value={dateString || ''} readOnly />
          </div>
        )}

        <DayPickerSingleDateController
          {...props}
          onDateChange={this.onDateChange}
          onFocusChange={this.onFocusChange}
          focused={focused}
          date={date}
        />
      </div>
    );
  }
}

DayPickerSingleDateControllerWrapper.defaultProps = defaultProps;

export default DayPickerSingleDateControllerWrapper;
