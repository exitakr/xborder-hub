import { ImageResponse } from "next/og";
import { brand } from "@oma/core";

export const runtime = "edge";
export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card that appears when a link to this app is posted anywhere.
 *
 * Generated rather than a checked-in PNG, so it cannot fall out of step with
 * the brand or need re-exporting on a rename. Until this existed, every share
 * on X, LINE or Slack rendered as a bare grey box with a URL — which is the
 * single worst thing to look like at the moment somebody is deciding whether
 * to click, and this app is about to be promoted on exactly those surfaces.
 *
 * Deliberately dark: it has to sit on both light and dark timelines, and a
 * dark card holds its edges against either.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0F1217",
          color: "#E8ECF1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 14,
              height: 56,
              borderRadius: 999,
              background: "#2DC48A",
            }}
          />
          <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {brand.name}
          </div>
        </div>

        <div style={{ marginTop: 28, fontSize: 36, lineHeight: 1.35, color: "#C3CCD8" }}>
          {brand.tagline.ja}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: 48 }}>
          {["カード", "時計", "バッグ", "スニーカー", "車"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid #2A303A",
                fontSize: 24,
                color: "#949EAB",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
