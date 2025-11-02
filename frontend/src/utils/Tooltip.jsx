import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./tooltip.css";

export default function Tooltip({ children, tooltip, delay = 700 }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef();
  const childRef = useRef();

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function showTooltip() {
    timeoutRef.current = setTimeout(() => {
      if (childRef.current) {
        const rect = childRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        });
        setVisible(true);
      }
    }, delay);
  }

  function hideTooltip() {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  const tooltipNode = visible
    ? createPortal(
        <div
          className="custom-tooltip"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: "translateX(-50%)",
            background: "#6a359c",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            fontSize: "0.95em",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          {tooltip}
        </div>,
        document.body
      )
    : null;

  // Clone child and attach ref and events
  const child = React.Children.only(children);
  const childProps = {
    ref: childRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  };

  return (
    <>
      {React.cloneElement(child, childProps)}
      {tooltipNode}
    </>
  );
}
