import moment from 'moment';

import {
  LEGACY_DISPLAY_FORMAT,
  LEGACY_ISO_FORMAT,
} from '../internal/legacyDateConstants';

export default function toMomentObject(dateString, customFormat) {
  const dateFormats = customFormat
    ? [customFormat, LEGACY_DISPLAY_FORMAT, LEGACY_ISO_FORMAT]
    : [LEGACY_DISPLAY_FORMAT, LEGACY_ISO_FORMAT];

  const date = moment(dateString, dateFormats, true);
  return date.isValid() ? date.hour(12) : null;
}
