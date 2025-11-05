export const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "LWB",
  "RWB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LAM",
  "RAM",
  "LW",
  "RW",
  "LF",
  "RF",
  "CF",
  "ST"
] as const;

export type PositionCode = typeof POSITIONS[number];

export function isValidPosition(value: string): value is PositionCode {
  return POSITIONS.includes(value as PositionCode);
}

export const POSITION_LABELS: Record<PositionCode, string> = {
  GK: "Goalkeeper",
  CB: "Center Back",
  LB: "Left Back",
  RB: "Right Back",
  LWB: "Left Wing Back",
  RWB: "Right Wing Back",
  CDM: "Central Defensive Midfielder",
  CM: "Central Midfielder",
  CAM: "Central Attacking Midfielder",
  LM: "Left Midfielder",
  RM: "Right Midfielder",
  LAM: "Left Attacking Midfielder",
  RAM: "Right Attacking Midfielder",
  LW: "Left Winger",
  RW: "Right Winger",
  LF: "Left Forward",
  RF: "Right Forward",
  CF: "Center Forward",
  ST: "Striker"
};
