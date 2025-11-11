// Centralized date formatting utility for all apps
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
}

// Format date without year (e.g., "Jan 15")
export function formatDateWithoutYear(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}
