import type { Artist, Discipline } from "./domain/artists";

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  idol: "Idol",
  actor: "Actor",
  director: "Director",
  model: "Model",
};

// A human-readable role for a person card/header. Prefers disciplines
// (e.g. "Idol · Actor"); falls back to the legacy group/soloist type.
export function roleLabel(a: Artist): string {
  if (a.disciplines && a.disciplines.length > 0) {
    return a.disciplines.map((d) => DISCIPLINE_LABELS[d]).join(" · ");
  }
  if (a.type === "group") return "Group";
  if (a.type === "soloist") return "Soloist";
  return "Individual";
}
