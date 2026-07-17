import Link from "next/link";
import type { Article } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import AttributionBadge from "./AttributionBadge";
import PhotoMedia from "./PhotoMedia";
import StatusFlag from "./StatusFlag";

export default function ArticleListItem({
  article,
  on = "dark",
}: {
  article: Article;
  on?: "dark" | "light";
}) {
  const ruleColor = on === "light" ? "border-bone-line" : "border-line";
  const mutedColor = on === "light" ? "text-muted-2" : "text-muted";

  return (
    <article className={`border-t ${ruleColor} pt-5`}>
      <div className="flex gap-4 sm:gap-5">
        {article.media && (
          <Link
            href={`/analysis/${article.slug}`}
            // Duplicate of the title link; keep it out of the tab order.
            tabIndex={-1}
            aria-hidden
            className={`relative w-24 shrink-0 self-start aspect-[4/5] overflow-hidden rounded-tile border ${ruleColor}`}
          >
            {/* The box is 96px wide but object-cover on a wide source needs
                width ≈ height × aspect (120px × ~2:1), so request ~240px. */}
            <PhotoMedia item={article.media} sizes="240px" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <Link href={`/analysis/${article.slug}`} className="group">
              <h3 className="font-serif text-xl leading-snug group-hover:text-crimson transition-colors">
                {renderEmphasis(article.title)}
              </h3>
            </Link>
            <div className="shrink-0">
              <StatusFlag status={article.status} on={on} />
            </div>
          </div>
          <p className={`mt-2 text-sm leading-relaxed ${mutedColor} max-w-2xl`}>
            {renderEmphasis(article.dek)}
          </p>
          <p className={`label mt-3 ${mutedColor} flex flex-wrap items-center gap-x-2 gap-y-1`}>
            <span>
              {article.author} · {absoluteDate(article.date)}
            </span>
            {article.media && (
              <>
                <span aria-hidden>·</span>
                <AttributionBadge source={article.media.credit} />
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
