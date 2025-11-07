import React, { forwardRef } from "react";
import Tooltip from "../Tooltip";
import "./PhoneDisplay.css";

// Helper to format phone as (xxx) xxx-xxxx
function formatPhone(phone) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function parsePhoneAndExt(raw) {
  if (!raw) return { phone: "", ext: "" };
  const match = raw.match(/^(.*?)(?:\s*(?:x|ext\.?|extension)\s*(\d+))?$/i);
  return {
    phone: match ? match[1].replace(/\s+$/, "") : raw,
    ext: match && match[2] ? match[2] : ""
  };
}


const PhoneDisplay = forwardRef(function PhoneDisplay({ value, className, tooltip }, ref) {
  const { phone, ext } = parsePhoneAndExt(value || "");
  const formatted = formatPhone(phone);
  const telTarget = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const anchor = (
    <a
      ref={ref}
      href={telTarget}
      className={["phone-display-link", className].filter(Boolean).join(" ")}
      tabIndex={0}
    >
      {formatted}
      {ext ? ` x${ext}` : ""}
    </a>
  );
  return tooltip ? <Tooltip tooltip={tooltip}>{anchor}</Tooltip> : anchor;
});

export default PhoneDisplay;
