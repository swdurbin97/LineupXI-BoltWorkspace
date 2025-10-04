export type Slot = {
  id?: string;
  x?: number;
  y?: number;
  role?: string;
};

export type FormationSeed = {
  name: string;            // e.g., "3-5-2"
  nickname?: string;       // optional nickname
  backline?: 3 | 4 | 5;    // convenience grouping
  positions?: string[];    // optional flat list of role codes
  slots?: Slot[];          // field coordinates
  style?: string;          // optional text
  description?: string;    // optional short description
};

export type TacticsText = {
  name: string;                 // must match formation (e.g., "3-5-2")
  nickname?: string;
  description?: string;
  advantages?: string[];
  disadvantages?: string[];
  howToCounter?: string[];
  suggestedCounters?: string[]; // e.g., ["4-3-3", "4-2-3-1"]
  playerRoles?: string[];       // compact string list
  summary?: {
    structure?: string;
    strengths?: string;
    weaknesses?: string;
    counters?: string;
    effectiveCounters?: string;
  };
};

export type FormationMerged = FormationSeed & {
  tactics?: TacticsText;
};
