import { ImageResponse } from "next/og";

export const alt = "MyKStars: K-stars, in focus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default branded social/Discover card (editorial-noir). Inherited by every page
// that doesn't define its own opengraph-image.
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
        <div style={{ display: "flex", fontSize: 130, lineHeight: 1 }}>
          <span>MyK</span>
          <span style={{ color: "#cc001e" }}>Stars</span>
        </div>
        <div style={{ fontSize: 30, color: "#b3b3b3", maxWidth: 900 }}>
          The freshest, credited photos of Korean celebrities, plus credible analysis.
        </div>
      </div>
    ),
    size,
  );
}
