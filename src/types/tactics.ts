export type FormationTactics = {
  code: string;                 // MUST exactly match formations.json "code"
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
