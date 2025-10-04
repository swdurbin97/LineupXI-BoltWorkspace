// Canonical list of positions
export const POSITIONS = [
  'GK',
  'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM', 'LAM', 'RAM',
  'CF', 'ST', 'LW', 'RW', 'LF', 'RF'
] as const;

// Map positions to their line (GK/DEF/MID/ATT)
export function getLineForPos(pos?: string): 'GK' | 'DEF' | 'MID' | 'ATT' {
  if (!pos) return 'MID';
  const upperPos = pos.toUpperCase();
  
  if (upperPos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'LCB', 'RCB'].includes(upperPos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'LAM', 'RAM', 'DM', 'LCM', 'RCM'].includes(upperPos)) return 'MID';
  if (['CF', 'ST', 'LW', 'RW', 'LF', 'RF', 'LST', 'RST'].includes(upperPos)) return 'ATT';
  
  return 'MID';
}

// Color tokens for each line
export const LINE_COLORS = {
  GK: '#7C3AED',   // Purple
  DEF: '#EF4444',  // Red
  MID: '#10B981',  // Green
  ATT: '#F97316'   // Orange
} as const;