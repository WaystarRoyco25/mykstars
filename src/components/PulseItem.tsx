import Link from "next/link";
import type { Artist, Pulse } from "@/lib/types";
import { PILLAR_LABELS } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import AttributionBadge from "./AttributionBadge";

export default function PulseItem({
  pulse,
  artists,
  on = "dark",
}: {
  pulse: Pulse;
  artists: Artist[];
  on?: "dark" | "light";
}) {
  const ruleColor = on === "light" ? "border-bone-line" : "border-line";
  const mutedColor = on === "light" ? "text-muted-2" : "text-muted";
  const artistNames =
    artists.length > 0
      ? artists.map((artist) => artist.name).join(", ")
      : PILLAR_LABELS[pulse.pillar];

  return (
    <article className={`border-t ${ruleColor} pt-5`}>
      <p className={`label ${mutedColor}`}>
        {artistNames} · {absoluteDate(pulse.date)}
      </p>
      <Link href={`/pulse/${pulse.slug}`} className="group mt-2 inline-block">
        <h3 className="font-serif text-xl leading-snug transition-colors group-hover:text-crimson">
          {renderEmphasis(pulse.heading)}
        </h3>
      </Link>
      <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedColor}`}>
        {renderEmphasis(pulse.body)}
      </p>
      <AttributionBadge
        source={pulse.source}
        className={`mt-3 ${mutedColor} ${on === "light" ? "hover:!text-ink" : ""}`}
      />
    </article>
  );
}
