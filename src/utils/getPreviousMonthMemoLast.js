let previousMonthKey;
let previousMonthValue;

export default function getPreviousMonthMemoLast(month) {
  const monthKey = month?.toISODate();
  if (monthKey !== previousMonthKey) {
    previousMonthKey = monthKey;
    previousMonthValue = month?.plus({ months: -1 }) || null;
  }
  return previousMonthValue;
}
