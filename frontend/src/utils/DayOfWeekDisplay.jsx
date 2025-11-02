import React from "react";
import "./dayofweek.css";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DayOfWeekDisplay({ activeDay }) {
  // activeDay: string ("Monday") or array (["Monday", "Wednesday"])
  const activeDays = Array.isArray(activeDay) ? activeDay : [activeDay];
  return (
    <div className="dayofweek-display">
      {FULL_DAYS.map((day, idx) => (
        <span
          key={day}
          className={
            activeDays.includes(day) ? "dayofweek-active" : "dayofweek-inactive"
          }
        >
          {DAYS[idx]}
        </span>
      ))}
    </div>
  );
}
