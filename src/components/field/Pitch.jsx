import React from "react";

/** Responsive SVG soccer pitch (105x68 ratio), full-width container */
export default function Pitch({ children }) {
  // Keep 105:68 aspect ratio (FIFA standard pitch proportion)
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative" style={{ paddingTop: `${(68/105)*100}%` }}>
        <svg
          viewBox="0 0 105 68"
          className="absolute inset-0 w-full h-full rounded-xl shadow-sm"
          role="img"
          aria-label="Soccer pitch"
        >
          <defs>
            <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopOpacity="1" stopColor="#1f9d55"/>
              <stop offset="100%" stopOpacity="1" stopColor="#187741"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="105" height="68" fill="url(#grass)" />
          {/* touchlines */}
          <rect x="1" y="1" width="103" height="66" fill="none" stroke="#ffffff" strokeWidth="0.6" />
          {/* halfway + center */}
          <line x1="52.5" y1="1" x2="52.5" y2="67" stroke="#ffffff" strokeWidth="0.5" />
          <circle cx="52.5" cy="34" r="5.5" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          {/* penalty boxes */}
          <rect x="1" y="18" width="16.5" height="32" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          <rect x="87.5" y="18" width="16.5" height="32" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          {/* 6-yard boxes */}
          <rect x="1" y="26" width="5.5" height="16" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          <rect x="98.5" y="26" width="5.5" height="16" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          {/* goals (visual only) */}
          <rect x="0" y="30.5" width="1" height="7" fill="#ffffff" />
          <rect x="104" y="30.5" width="1" height="7" fill="#ffffff" />

          {children}
        </svg>
      </div>
    </div>
  );
}