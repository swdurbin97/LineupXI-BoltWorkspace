import React, { useMemo } from "react";
import Pitch from "./Pitch";

/**
 * Compute player bands from formation code.
 * Accepts "343", "3-4-1-2", "4-2-3-1 (Wide)", etc. Extracts digits into bands.
 */
function computeLayout(code) {
  const bands = (code || "")
    .match(/\d+/g)?.join("-")
    ?.split("-")
    .map(n => parseInt(n, 10))
    .filter(n => !Number.isNaN(n)) || [];
  if (bands.length === 0) return { rows: [4,3,3], valid:false };
  return { rows: bands, valid:true };
}

/** Evenly spread N values between min..max (inclusive). */
function spread(n, min, max) {
  if (n <= 0) return [];
  if (n === 1) return [ (min + max)/2 ];
  const step = (max - min) / (n - 1);
  return Array.from({length:n}, (_, i) => min + i*step);
}

/**
 * Generate position abbreviations for labels
 */
function getPositionLabel(bandLabel, index, total) {
  if (bandLabel === "GK") return "GK";
  
  // For defenders
  if (bandLabel === "DEF") {
    if (total === 3) return ["LCB", "CB", "RCB"][index];
    if (total === 4) return ["LB", "LCB", "RCB", "RB"][index];
    if (total === 5) return ["LWB", "LCB", "CB", "RCB", "RWB"][index];
    return `CB${index + 1}`;
  }
  
  // For midfielders
  if (bandLabel === "MID") {
    if (total === 3) return ["LM", "CM", "RM"][index];
    if (total === 4) return ["LM", "LCM", "RCM", "RM"][index];
    if (total === 5) return ["LM", "LCM", "CM", "RCM", "RM"][index];
    return `CM${index + 1}`;
  }
  
  // For attacking midfielders
  if (bandLabel === "AM") {
    if (total === 1) return "CAM";
    if (total === 2) return ["LAM", "RAM"][index];
    if (total === 3) return ["LAM", "CAM", "RAM"][index];
    return `AM${index + 1}`;
  }
  
  // For forwards
  if (bandLabel === "FWD") {
    if (total === 1) return "ST";
    if (total === 2) return ["LST", "RST"][index];
    if (total === 3) return ["LW", "ST", "RW"][index];
    return `ST${index + 1}`;
  }
  
  return `${bandLabel}${index + 1}`;
}

/**
 * FormationField
 * - Bands flow LEFT -> RIGHT (defense to attack)
 * - Players within each band are spread TOP -> BOTTOM
 * - flip: boolean to mirror horizontally
 * - showLabels: boolean to show position labels
 */
export default function FormationField({ code, labels=false, showLabels=true, flip=false }) {
  const layout = useMemo(() => computeLayout(code), [code]);

  // Pitch coords: x 0..105, y 0..68
  const topMargin = 8, bottomMargin = 8;
  const left = 8, right = 97;
  const centerY = 34;

  // Columns for bands (left -> right)
  const totalBands = layout.rows.length;
  const usableW = right - left;
  const colStep = usableW / (totalBands + 1);
  const bandXs = layout.rows.map((_, idx) => left + colStep * (idx + 1));

  // Y positions for players within a band (top -> bottom)
  const top = topMargin, bottom = 68 - bottomMargin;

  const nodes = [];

  // GK: just in front of left goal
  nodes.push({ 
    x: left - 2.8, 
    y: centerY, 
    label: "GK", 
    band: "GK",
    tooltip: "Goalkeeper - Last line of defense, shot stopping"
  });

  // Band labels (generic)
  const bandNames = ["DEF","MID","AM","FWD"];

  layout.rows.forEach((count, idx) => {
    const x = bandXs[idx];
    const ys = spread(count, top, bottom);
    const bandLabel = bandNames[Math.min(idx, bandNames.length-1)];
    ys.forEach((y, i) => {
      const posLabel = getPositionLabel(bandLabel, i, count);
      const tooltip = getTooltipText(posLabel, bandLabel);
      nodes.push({
        x, y,
        label: labels || showLabels ? posLabel : "",
        band: bandLabel,
        tooltip
      });
    });
  });

  // Optional horizontal mirror
  const mirrorX = (x) => (flip ? 105 - x : x);

  return (
    <Pitch>
      {nodes.map((n, i) => (
        <g key={i} className="cursor-default group">
          <circle cx={mirrorX(n.x)} cy={n.y} r="2.8"
                  fill={n.band==="GK" ? "#111827" : "#ffffff"}
                  stroke="#111827" strokeWidth="0.6" />
          {n.label && (showLabels || labels) && (
            <text x={mirrorX(n.x)} y={n.y+0.4} fontSize="2.2" textAnchor="middle"
                  fill={n.band==="GK" ? "#ffffff" : "#111827"}
                  fontWeight="600">
              {n.label}
            </text>
          )}
          {/* Tooltip */}
          <title>{n.tooltip}</title>
        </g>
      ))}
    </Pitch>
  );
}

/**
 * Generate tooltip text for positions
 */
function getTooltipText(posLabel, bandLabel) {
  const tooltips = {
    "GK": "Goalkeeper - Last line of defense",
    "LB": "Left Back - Defends left flank",
    "RB": "Right Back - Defends right flank", 
    "LCB": "Left Center Back - Central defender",
    "CB": "Center Back - Central defender",
    "RCB": "Right Center Back - Central defender",
    "LWB": "Left Wing Back - Attacking fullback",
    "RWB": "Right Wing Back - Attacking fullback",
    "CDM": "Defensive Midfielder - Shields defense",
    "CM": "Central Midfielder - Box-to-box player",
    "LCM": "Left Central Midfielder",
    "RCM": "Right Central Midfielder",
    "LM": "Left Midfielder - Wide midfielder",
    "RM": "Right Midfielder - Wide midfielder",
    "CAM": "Attacking Midfielder - Creates chances",
    "LAM": "Left Attacking Midfielder",
    "RAM": "Right Attacking Midfielder",
    "LW": "Left Winger - Wide attacker",
    "RW": "Right Winger - Wide attacker",
    "CF": "Center Forward - Link-up striker",
    "ST": "Striker - Main goalscorer",
    "LST": "Left Striker",
    "RST": "Right Striker"
  };
  
  return tooltips[posLabel] || `${posLabel} - ${bandLabel} player`;
}