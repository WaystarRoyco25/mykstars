import { ImageResponse } from "next/og";
import { getArticle } from "@/lib/data/articles";
import { stripEmphasis } from "@/lib/text";

export const alt = "MyKStars analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_LABEL: Record<string, string> = {
  analysis: "ANALYSIS",
  confirmed: "CONFIRMED",
  unverified: "UNVERIFIED",
};

export default async function ArticleOg({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  const title = stripEmphasis(article?.title ?? "MyKStars");
  const status = article ? STATUS_LABEL[article.status] : "ANALYSIS";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0e0e",
          color: "#f0f4f5",
          padding: 80,
          fontFamily: "serif",
        }}
      >
        <div style={{ color: "#cc001e", fontSize: 26, letterSpacing: 5 }}>{status}</div>
        <div style={{ display: "flex", fontSize: 72, lineHeight: 1.08, maxWidth: 1040 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30 }}>
          <span>MyK</span>
          <span style={{ color: "#cc001e" }}>Stars</span>
        </div>
      </div>
    ),
    size,
  );
}
