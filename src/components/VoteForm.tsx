"use client";

import { useState, useTransition } from "react";
import { castVote, type VoteResult } from "@/app/predictions/actions";

// The interactive vote control on an open question. Each option is a button;
// casting (or changing) a pick calls the castVote Server Action, which records
// the vote and revalidates the tally bars rendered above by PredictionOptions.
export default function VoteForm({
  slug,
  options,
  votedOptionId,
}: {
  slug: string;
  options: { id: string; label: string }[];
  votedOptionId: string | null;
}) {
  const [voted, setVoted] = useState<string | null>(votedOptionId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function vote(optionId: string) {
    if (optionId === voted) return;
    setError(null);
    startTransition(async () => {
      const res: VoteResult = await castVote(slug, optionId);
      if (res.ok) setVoted(res.optionId);
      else setError(res.error);
    });
  }

  return (
    <div className="mt-6 border border-line p-5">
      <p className="label text-muted mb-3">
        {voted ? "Your pick — tap another to change it" : "Cast your prediction"}
      </p>
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const isPick = voted === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => vote(o.id)}
              disabled={pending}
              aria-pressed={isPick}
              className={`text-left font-serif text-base sm:text-lg border px-4 py-3 transition-colors disabled:opacity-60 ${
                isPick
                  ? "border-crimson text-crimson"
                  : "border-line text-bone hover:border-crimson"
              }`}
            >
              {o.label}
              {isPick && <span className="label text-crimson ml-2 align-middle">Your pick</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-crimson mt-3">{error}</p>}
      <p className="text-xs text-muted-2 mt-3 leading-relaxed">
        One pick per question, change it anytime while voting is open. For fun and for fandom — never a bet.
      </p>
    </div>
  );
}
