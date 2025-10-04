export type PositionCode = string; // "GK", "RB", "LCB", etc.

export interface Player {
  id: string;
  name: string;
  jersey: number;
  primaryPos?: PositionCode;
  secondaryPos?: PositionCode[];
  foot?: 'L' | 'R' | 'B';
  notes?: string;
  status?: 'available' | 'injured' | 'unavailable';
}

export interface Team {
  id: string;
  name: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  players: Player[];
}

export interface FormationSlot {
  code: string;
  x: number;
  y: number;
}

export interface Lineup {
  teamId: string;
  formationCode: string;
  onField: Record<PositionCode, string | null>; // slot -> playerId
  bench: string[]; // DEPRECATED - for backwards compat
  benchSlots: (string | null)[]; // exactly 8 slots
  roles: {
    captain?: string;
    gk?: string;
    pk?: string;
    ck?: string;
    fk?: string;
  };
}