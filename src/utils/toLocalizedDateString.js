import moment from 'moment';

import toMomentObject from './toMomentObject';

import { LEGACY_DISPLAY_FORMAT } from '../internal/legacyDateConstants';

export default function toLocalizedDateString(date, currentFormat) {
  const dateObj = moment.isMoment(date) ? date : toMomentObject(date, currentFormat);
  if (!dateObj) return null;

  return dateObj.format(LEGACY_DISPLAY_FORMAT);
}
