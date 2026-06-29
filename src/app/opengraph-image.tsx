import { ImageResponse } from "next/og";
import { LOCKUP_SVG } from "@/lib/brand";

export const alt = "MyKStars: K-stars, in focus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The brand lockup, embedded as a data URI so Satori rasterizes it into the card.
const lockup = `data:image/svg+xml;base64,${Buffer.from(LOCKUP_SVG).toString("base64")}`;

// Default branded social/Discover card (editorial-noir), now built around the
// real logo. Inherited by every page that doesn't define its own opengraph-image.
export default function OpengraphImage() {
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
        <div style={{ color: "#cc001e", fontSize: 26, letterSpacing: 6 }}>
          K-STARS, IN FOCUS
        </div>
        <div style={{ display: "flex" }}>
          {/* viewBox 1500x600 -> 2.5:1 */}
          <img src={lockup} width={780} height={312} alt="" />
        </div>
        <div style={{ fontSize: 30, color: "#b3b3b3", maxWidth: 900 }}>
          The freshest, credited photos of Korean celebrities, plus credible analysis.
        </div>
      </div>
    ),
    size,
  );
}
