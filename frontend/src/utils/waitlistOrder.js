/**
 * Shared waitlist ordering: ranked ascending, then unranked by last/first name.
 * Matches backend activity/utils/waitlist_order.py
 */

export function sortWaitlist(students) {
  return [...students].sort((a, b) => {
    const aRank = a.waitlist_rank;
    const bRank = b.waitlist_rank;
    const aRanked = aRank != null;
    const bRanked = bRank != null;
    if (aRanked !== bRanked) {
      return aRanked ? -1 : 1;
    }
    if (aRanked && bRanked && aRank !== bRank) {
      return aRank - bRank;
    }
    const lastCompare = (a.last_name || '').localeCompare(b.last_name || '');
    if (lastCompare !== 0) return lastCompare;
    return (a.first_name || '').localeCompare(b.first_name || '');
  });
}

export function sortByLastFirstName(students) {
  return [...students].sort((a, b) => {
    const lastCompare = (a.last_name || '').localeCompare(b.last_name || '');
    if (lastCompare !== 0) return lastCompare;
    return (a.first_name || '').localeCompare(b.first_name || '');
  });
}

export function studentDisplayName(student) {
  return (
    student.display_name ||
    student.full_name ||
    student.name ||
    student.email ||
    student.id ||
    'Unknown'
  );
}
