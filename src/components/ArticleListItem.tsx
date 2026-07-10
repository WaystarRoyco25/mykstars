import Link from "next/link";
import type { Article } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
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
      <p className={`label mt-3 ${mutedColor}`}>
        {article.author} · {absoluteDate(article.date)}
      </p>
    </article>
  );
}
