import React from "react";

const DAY_ABBR = {
  "Monday": "Mon",
  "Tuesday": "Tue",
  "Wednesday": "Wed",
  "Thursday": "Thu",
  "Friday": "Fri",
  "Saturday": "Sat",
  "Sunday": "Sun"
};

export default function ClassLabel({ activity, className = "" }) {
  if (!activity) return null;
  const day = DAY_ABBR[activity.day_of_week] || activity.day_of_week;
  const location = activity.location || "";
  const type = activity.type || "";
  // Parse time and determine descriptor
  let descriptor = "";
  if (activity.time) {
    let hour = 0;
    let minute = 0;
    // Accepts "HH:MM" or "HH:MM AM/PM"
    let timeStr = activity.time;
    if (/AM|PM/.test(timeStr)) {
      const [time, period] = timeStr.split(" ");
      [hour, minute] = time.split(":").map(Number);
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
    } else {
      [hour, minute] = timeStr.split(":").map(Number);
    }
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes < 540) descriptor = "early morning"; // before 9:00am
    else if (totalMinutes < 720) descriptor = "morning"; // 9:00am - 12:00pm
    else if (totalMinutes < 1020) descriptor = "afternoon"; // 12:00pm - 5:00pm
    else descriptor = "evening"; // after 5:00pm
  }
  // Build label and convert to titlecase
  const label = `${day} ${descriptor} ${location} ${type}`.replace(/ +/g, " ").trim();
  const titleCase = str => str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return (
    <span className={className}>
      {titleCase(label)}
    </span>
  );
}
