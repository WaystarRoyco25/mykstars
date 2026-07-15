// ---------------------------------------------------------------------------
// The site clock. NOW is a fixed reference so relative timestamps stay
// deterministic across server renders; every freshness and date check under
// scripts/ measures against this value, never the wall clock. Bump it with
// every publishing refresh (the NOW-bump ritual, docs/roster-playbook.md).
// ---------------------------------------------------------------------------
export const NOW = "2026-07-15T20:00:00+09:00";
