import { ImageResponse } from "next/og";
import { getGallery } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/types";

export const alt = "MyKStars gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function GalleryOg({
  params,
}: {
  params: Promise<{ gallerySlug: string }>;
}) {
  const { gallerySlug } = await params;
  const gallery = await getGallery(gallerySlug);
  const title = gallery?.title ?? "MyKStars";
  const kicker = gallery
    ? `${CATEGORY_LABELS[gallery.category].toUpperCase()} · VIA ${gallery.source.name.toUpperCase()}`
    : "MYKSTARS";

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
        <div style={{ color: "#cc001e", fontSize: 26, letterSpacing: 5 }}>{kicker}</div>
        <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, maxWidth: 1040 }}>
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
