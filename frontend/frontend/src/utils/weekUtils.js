// Helper utilities for week calculations used across dashboards
// Exported functions:
// - getWeekNumber(termStartDate): returns 1-based week number relative to provided termStartDate (Date or ISO string). If no termStartDate provided, falls back to Jan 1 of current year.
export function getWeekNumber(termStartDate) {
  let start;
  if (!termStartDate) {
    start = new Date(new Date().getFullYear(), 0, 1);
  } else {
    start = new Date(termStartDate);
    if (isNaN(start.getTime())) start = new Date(new Date().getFullYear(), 0, 1);
  }

  const now = new Date();
  const diff = (now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000) / 86400000;
  // Make sure at least week 1 is returned
  return Math.max(1, Math.ceil((diff + start.getDay() + 1) / 7));
}

const WeekUtils = { getWeekNumber };
export default WeekUtils;
