// Format time string (e.g., '9:00 AM' or '13:15') to 'h:mm AM/PM'
export function formatTime(timeStr) {
  if (!timeStr) return '';
  // If already in AM/PM format, return as is
  if (/AM|PM/.test(timeStr)) return timeStr;
  // Otherwise, assume 24-hour format
  let [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

// Parse time string from 'h:mm AM/PM' or 'h AM/PM' to 'HH:MM' 24-hour format
export function parseTime12hr(val) {
  // Match with optional minutes: "6am", "6 AM", "6:00 PM", "6:30pm"
  let match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    let m = match[2] ? parseInt(match[2], 10) : 0; // Default to 0 minutes if not provided
    let ampm = match[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  return val;
}
