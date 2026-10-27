/**
 * Determine if a year is a leap year (Gregorian calendar rules)
 */
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Get total number of days in a given month (0-indexed month)
 */
const getDaysInMonth = (year, monthIndex) => {
  // Array of days per month: Jan (0) to Dec (11)
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[monthIndex];
};

/**
 * Predictably compute next due date for recurring obligations.
 *
 * Rules:
 * - Monthly: Adds 1 month. If target day exceeds the days in that month
 *   (e.g. Jan 31 -> Feb), clamps to the last valid day of that month (Feb 28/29).
 * - Yearly: Adds 1 year. If Feb 29 on a leap year transitions into a non-leap year,
 *   clamps to Feb 28.
 */
const computeNextDueDate = (currentDueDate, recurrence) => {
  if (!currentDueDate || !recurrence || recurrence === 'none') {
    return null;
  }

  const d = new Date(currentDueDate);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  if (recurrence === 'monthly') {
    const nextMonthTotal = month + 1;
    const targetYear = year + Math.floor(nextMonthTotal / 12);
    const targetMonth = nextMonthTotal % 12;
    const maxDays = getDaysInMonth(targetYear, targetMonth);
    const targetDay = Math.min(day, maxDays);

    const nextDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
    return nextDate;
  }

  if (recurrence === 'yearly') {
    const targetYear = year + 1;
    const targetMonth = month;
    const maxDays = getDaysInMonth(targetYear, targetMonth);
    const targetDay = Math.min(day, maxDays);

    const nextDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
    return nextDate;
  }

  return null;
};

module.exports = {
  isLeapYear,
  getDaysInMonth,
  computeNextDueDate
};
