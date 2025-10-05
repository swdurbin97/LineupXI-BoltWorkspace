export type SavedLineup = {
  id: string;
  name: string;
  teamId?: string | null;
  teamName?: string | null;
  formation: { code: string; name: string };
  createdAt: number;
  updatedAt: number;
  assignments: {
    onField: Record<string, string | null>;
    bench: string[];
  };
  roles?: {
    captain?: string;
    setPieces?: Record<string, string>;
  };
  notes?: string;
};

export type SerializedBuilderState = {
  formation: { code: string; name: string };
  assignments: { onField: Record<string, string | null>; bench: string[] };
  teamId?: string | null;
  teamName?: string | null;
};
