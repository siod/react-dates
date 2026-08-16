import { addMonths } from '../internal/date';

let previousMonthKey;
let previousMonthValue;

export default function getPreviousMonthMemoLast(month) {
  if (month !== previousMonthKey) {
    previousMonthKey = month;
    previousMonthValue = addMonths(month, -1);
  }
  return previousMonthValue;
}
