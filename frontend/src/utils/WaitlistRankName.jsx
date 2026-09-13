import React from 'react';
import { studentDisplayName } from './waitlistOrder';
import './WaitlistRankName.css';

/**
 * Aligned rank + name so names stay vertically aligned when some rows lack a rank.
 * Pass `children` to customize the name (e.g. a Link); otherwise shows display name.
 */
export default function WaitlistRankName({ student, children, className = '' }) {
  const rank = student?.waitlist_rank;
  return (
    <span className={`waitlist-rank-name ${className}`.trim()}>
      <span className="waitlist-rank-slot" aria-label={rank != null ? `Rank ${rank}` : 'Unranked'}>
        {rank != null ? rank : ''}
      </span>
      <span className="waitlist-rank-name-text">
        {children ?? studentDisplayName(student)}
      </span>
    </span>
  );
}
