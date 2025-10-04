export type Slot = {
  slot_code: string;
  x: number;
  y: number;
};

export type FormationSeed = {
  code: string;
  name: string;
  style?: string;
  slot_map: Slot[];
  position_counts_sum?: number;
  nickname?: string;
  backline?: 3 | 4 | 5;
  description?: string;
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
