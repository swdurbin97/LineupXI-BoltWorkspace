export type FormationTactics = {
  code: string;                 // Formation code (e.g., "433")
  name: string;                 // Exact canonical name from formations.json (e.g., "4-3-3 (Balanced)") - PRIMARY KEY
  title?: string;
  overview?: string;
  advantages?: string[];
  disadvantages?: string[];
  how_to_counter?: string[];
  suggested_counters?: string[]; // free text or codes; leave as-is
  player_roles?: string[];       // free text list
  summary_table?: string;        // preformatted string
};

export type TacticsContent = {
  tactics_content: FormationTactics[];
};
