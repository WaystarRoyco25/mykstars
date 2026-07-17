// Minimal checked-in database contract for the live Fan Forecast store.
// Keep this deliberately narrow: it describes only the rows this application
// reads and writes, without pretending to be a generated schema migration.

export type VoteRow = {
  prediction_slug: string;
  option_id: string;
  voter_id: string;
};

export type PredictionTallyRow = {
  prediction_slug: string;
  option_id: string;
  votes: number;
};

export type MyKStarsDatabase = {
  public: {
    Tables: {
      votes: {
        Row: VoteRow;
        Insert: VoteRow;
        Update: Partial<VoteRow>;
        Relationships: [];
      };
    };
    Views: {
      prediction_tallies: {
        Row: PredictionTallyRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
