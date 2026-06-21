import Link from "next/link";
import type { Article } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import StatusFlag from "./StatusFlag";

export default function ArticleListItem({
  article,
  on = "dark",
}: {
  article: Article;
  on?: "dark" | "light";
}) {
  const ruleColor = on === "light" ? "border-bone-line" : "border-line";
  const dekColor = on === "light" ? "text-muted-2" : "text-muted";

  return (
    <article className={`border-t ${ruleColor} pt-5`}>
      <div className="flex items-baseline justify-between gap-4">
        <Link href={`/news/${article.slug}`} className="group">
          <h3 className="font-serif text-xl leading-snug group-hover:text-crimson transition-colors">
            {article.title}
          </h3>
        </Link>
        <div className="shrink-0">
          <StatusFlag status={article.status} on={on} />
        </div>
      </div>
      <p className={`mt-2 text-sm leading-relaxed ${dekColor} max-w-2xl`}>{article.dek}</p>
      <p className={`label mt-3 ${on === "light" ? "text-muted-2" : "text-muted"}`}>
        {article.author} · {absoluteDate(article.date)}
      </p>
    </article>
  );
}
