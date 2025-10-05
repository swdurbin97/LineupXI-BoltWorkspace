import React, { useEffect, useMemo, useState } from "react";
import Pitch from "./Pitch";

/**
 * FormationFieldV2 - Uses actual slot_map coordinates from data
 * Falls back to computed layout if no slot_map is available
 */
export default function FormationFieldV2({ 
  code, 
  formation = null, // Pass in the full formation object with slot_map
  showLabels = true, 
  flip = false 
}) {
  const [formationData, setFormationData] = useState(formation);
  const [loading, setLoading] = useState(false);

  // Load formation data if not provided
  useEffect(() => {
    if (!formation && code) {
      setLoading(true);
      fetch('/data/formations.json')
        .then(res => res.json())
        .then(data => {
          const normalized = String(code).toLowerCase().replace(/[^0-9a-z]/g, '');
          const found = data.formations?.find(f => {
            const fCode = String(f.code || f.name || '').toLowerCase().replace(/[^0-9a-z]/g, '');
            return fCode === normalized;
          });
          setFormationData(found);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [formation, code]);

  // Generate nodes from slot_map or fallback to computed layout
  const nodes = useMemo(() => {
    if (formationData?.slot_map && Array.isArray(formationData.slot_map)) {
      // Use coordinates from canonical formations.json
      // Data: absolute 105×68, bottom-left origin
      // SVG: 105×68 viewBox, top-left origin
      // Therefore: flip Y-axis only
      const PITCH_W = 105;
      const PITCH_H = 68;

      return formationData.slot_map.map(slot => {
        const renderX = slot.x;
        const renderY = PITCH_H - slot.y; // Flip Y: bottom-left → top-left

        return {
          x: renderX,
          y: renderY,
          label: slot.slot_code, // Use clean label directly
          band: getBandFromSlot(slot.slot_code),
          tooltip: getTooltipText(slot.slot_code)
        };
      });
    }

    // Fallback to computed layout (same as original FormationField)
    return computeLayoutNodes(code);
  }, [formationData, code]);

  // Apply horizontal mirror if requested
  const mirrorX = (x) => (flip ? 105 - x : x);

  // Enable grid in dev mode (check URL params)
  const showGrid = typeof window !== 'undefined' && window.location.search.includes('grid');

  if (loading) {
    return (
      <Pitch showGrid={showGrid}>
        <text x="52.5" y="34" fontSize="3" textAnchor="middle" fill="#999">
          Loading...
        </text>
      </Pitch>
    );
  }

  return (
    <Pitch showGrid={showGrid}>
      {nodes.map((n, i) => (
        <g key={i} className="cursor-default group">
          <circle 
            cx={mirrorX(n.x)} 
            cy={n.y} 
            r="2.8"
            fill={n.band === "GK" ? "#111827" : "#ffffff"}
            stroke="#111827" 
            strokeWidth="0.6" 
          />
          {n.label && showLabels && (
            <text 
              x={mirrorX(n.x)} 
              y={n.y + 0.4} 
              fontSize="2.2" 
              textAnchor="middle"
              fill={n.band === "GK" ? "#ffffff" : "#111827"}
              fontWeight="600"
            >
              {n.label}
            </text>
          )}
          <title>{n.tooltip}</title>
        </g>
      ))}
    </Pitch>
  );
}

// Format slot codes to display labels
function formatSlotLabel(slotCode) {
  // Strip numeric suffixes from all position codes (CB1→CB, ST2→ST, etc.)
  // Keep underlying slot code intact - this is display only
  return slotCode.replace(/\d+$/, '');
}

// Determine band/category from slot code
function getBandFromSlot(slotCode) {
  if (slotCode === 'GK') return 'GK';
  if (/^(CB|LB|RB|LWB|RWB|LCB|RCB)/.test(slotCode)) return 'DEF';
  if (/^(CDM|CM|LM|RM|LCM|RCM|DM)/.test(slotCode)) return 'MID';
  if (/^(CAM|LAM|RAM|AM)/.test(slotCode)) return 'AM';
  if (/^(ST|CF|LW|RW|LF|RF|LST|RST)/.test(slotCode)) return 'FWD';
  return 'MID'; // Default
}

// Generate tooltip text for positions
function getTooltipText(slotCode) {
  const tooltips = {
    "GK": "Goalkeeper - Last line of defense",
    "LB": "Left Back - Defends left flank",
    "RB": "Right Back - Defends right flank",
    "LCB": "Left Center Back - Left side central defender",
    "CB": "Center Back - Central defender",
    "RCB": "Right Center Back - Right side central defender",
    "LWB": "Left Wing Back - Attacking left fullback",
    "RWB": "Right Wing Back - Attacking right fullback",
    "CDM": "Defensive Midfielder - Shields the defense",
    "CM": "Central Midfielder - Box-to-box player",
    "LCM": "Left Central Midfielder - Left side central mid",
    "RCM": "Right Central Midfielder - Right side central mid",
    "LM": "Left Midfielder - Wide left midfielder",
    "RM": "Right Midfielder - Wide right midfielder",
    "CAM": "Attacking Midfielder - Creates chances",
    "LAM": "Left Attacking Midfielder - Left side attacking mid",
    "RAM": "Right Attacking Midfielder - Right side attacking mid",
    "LW": "Left Winger - Wide left attacker",
    "RW": "Right Winger - Wide right attacker",
    "LF": "Left Forward - Left side forward",
    "RF": "Right Forward - Right side forward",
    "CF": "Center Forward - Link-up striker",
    "ST": "Striker - Main goalscorer",
    "LST": "Left Striker - Left side striker",
    "RST": "Right Striker - Right side striker"
  };
  
  const baseCode = slotCode.replace(/\d+$/, '');
  return tooltips[baseCode] || `${slotCode} - Field player`;
}

// Fallback: Compute layout from formation code (e.g., "4-3-3")
function computeLayoutNodes(code) {
  const bands = (code || "")
    .match(/\d+/g)?.join("-")
    ?.split("-")
    .map(n => parseInt(n, 10))
    .filter(n => !Number.isNaN(n)) || [];
  
  if (bands.length === 0) return [];
  
  const nodes = [];
  const topMargin = 8, bottomMargin = 8;
  const left = 8, right = 97;
  const centerY = 34;
  
  // GK position
  nodes.push({
    x: left - 2.8,
    y: centerY,
    label: "GK",
    band: "GK",
    tooltip: "Goalkeeper - Last line of defense"
  });
  
  // Band positions
  const totalBands = bands.length;
  const usableW = right - left;
  const colStep = usableW / (totalBands + 1);
  const bandNames = ["DEF", "MID", "AM", "FWD"];
  
  bands.forEach((count, idx) => {
    const x = left + colStep * (idx + 1);
    const top = topMargin;
    const bottom = 68 - bottomMargin;
    const ys = spread(count, top, bottom);
    const bandLabel = bandNames[Math.min(idx, bandNames.length - 1)];
    
    ys.forEach((y, i) => {
      const posLabel = getPositionLabel(bandLabel, i, count);
      nodes.push({
        x, y,
        label: posLabel,
        band: bandLabel,
        tooltip: getTooltipText(posLabel)
      });
    });
  });
  
  return nodes;
}

// Helper: Evenly spread N values between min..max
function spread(n, min, max) {
  if (n <= 0) return [];
  if (n === 1) return [(min + max) / 2];
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, i) => min + i * step);
}

// Generate position abbreviations for computed layout
function getPositionLabel(bandLabel, index, total) {
  if (bandLabel === "GK") return "GK";
  
  if (bandLabel === "DEF") {
    if (total === 3) return ["LCB", "CB", "RCB"][index];
    if (total === 4) return ["LB", "LCB", "RCB", "RB"][index];
    if (total === 5) return ["LWB", "LCB", "CB", "RCB", "RWB"][index];
    return `CB${index + 1}`;
  }
  
  if (bandLabel === "MID") {
    if (total === 3) return ["LM", "CM", "RM"][index];
    if (total === 4) return ["LM", "LCM", "RCM", "RM"][index];
    if (total === 5) return ["LM", "LCM", "CM", "RCM", "RM"][index];
    return `CM${index + 1}`;
  }
  
  if (bandLabel === "AM") {
    if (total === 1) return "CAM";
    if (total === 2) return ["LAM", "RAM"][index];
    if (total === 3) return ["LAM", "CAM", "RAM"][index];
    return `AM${index + 1}`;
  }
  
  if (bandLabel === "FWD") {
    if (total === 1) return "ST";
    if (total === 2) return ["LST", "RST"][index];
    if (total === 3) return ["LW", "ST", "RW"][index];
    return `ST${index + 1}`;
  }
  
  return `${bandLabel}${index + 1}`;
}