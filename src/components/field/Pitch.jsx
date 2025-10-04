import React from "react";

/** Responsive SVG soccer pitch (105x68 ratio), full-width container */
export default function Pitch({ children, showGrid = false }) {
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

          {/* Dev mode: 10% tick grid overlay */}
          {showGrid && (
            <g opacity="0.3">
              {/* Vertical lines every 10% */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => {
                const x = (pct / 100) * 105;
                return (
                  <g key={`v${pct}`}>
                    <line x1={x} y1="0" x2={x} y2="68" stroke="#ffff00" strokeWidth="0.3" strokeDasharray="1,1" />
                    <text x={x} y="2" fontSize="2" fill="#ffff00" textAnchor="middle">{pct}</text>
                  </g>
                );
              })}
              {/* Horizontal lines every 10% */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => {
                const y = (pct / 100) * 68;
                return (
                  <g key={`h${pct}`}>
                    <line x1="0" y1={y} x2="105" y2={y} stroke="#ffff00" strokeWidth="0.3" strokeDasharray="1,1" />
                    <text x="2" y={y + 1} fontSize="2" fill="#ffff00">{pct}</text>
                  </g>
                );
              })}
            </g>
          )}

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