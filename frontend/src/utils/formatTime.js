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
