import React from "react";
import "./dayofweek.css";

// Day names in order for display and sorting
export const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
export const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Get the index of a day name (0-6, Sunday=0, Saturday=6)
 * @param {string} dayName - Full day name (e.g., "Monday")
 * @returns {number} Index of the day (0-6), or -1 if not found
 */
export function getDayIndex(dayName) {
  return DAYS_FULL.indexOf(dayName);
}

/**
 * Parse a time string to minutes since midnight for comparison
 * Handles both 12-hour (with AM/PM) and 24-hour formats
 * @param {string} timeString - Time in format "HH:MM" or "HH:MM AM/PM"
 * @returns {number} Minutes since midnight
 */
export function parseTimeToMinutes(timeString) {
  if (!timeString) return 0;

  // Check for AM/PM format
  if (/AM|PM/.test(timeString)) {
    const [time, period] = timeString.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  } else {
    // 24-hour format
    const [h, m] = timeString.split(':').map(Number);
    return h * 60 + m;
  }
}

/**
 * Create a sortable value for day+time combination
 * Useful for sorting activities by when they occur in the week
 * @param {string} dayName - Full day name (e.g., "Monday")
 * @param {string} timeString - Time in format "HH:MM" or "HH:MM AM/PM"
 * @returns {number} A comparable number (day * 1440 + minutes)
 */
export function getDayTimeSortValue(dayName, timeString) {
  const dayIndex = getDayIndex(dayName);
  const timeMinutes = parseTimeToMinutes(timeString);
  // Multiply day by 1440 (minutes in a day) to ensure days sort before times
  return dayIndex * 1440 + timeMinutes;
}

/**
 * Compare two day+time combinations for sorting
 * @param {string} dayA - Day name for first item
 * @param {string} timeA - Time string for first item
 * @param {string} dayB - Day name for second item
 * @param {string} timeB - Time string for second item
 * @returns {number} -1, 0, or 1 for sorting
 */
export function compareDayTime(dayA, timeA, dayB, timeB) {
  const valA = getDayTimeSortValue(dayA, timeA);
  const valB = getDayTimeSortValue(dayB, timeB);
  return valA - valB;
}

/**
 * DayOfWeek display component
 * Shows a row of day letters with active days highlighted
 */
export default function DayOfWeek({ activeDay }) {
  // activeDay: string ("Monday") or array (["Monday", "Wednesday"])
  const activeDays = Array.isArray(activeDay) ? activeDay : [activeDay];
  return (
    <div className="dayofweek-display">
      {DAYS_FULL.map((day, idx) => (
        <span
          key={day}
          className={
            activeDays.includes(day) ? "dayofweek-active" : "dayofweek-inactive"
          }
        >
          {DAYS_SHORT[idx]}
        </span>
      ))}
    </div>
  );
}
