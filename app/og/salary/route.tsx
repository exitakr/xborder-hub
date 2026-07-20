import { ImageResponse } from "next/og";
import { findCountry, findRole } from "@/lib/seo/salaryPages";

export const runtime = "edge";

/**
 * Dynamic OGP card for the /salaries/[country]/[role] SEO pages.
 * English-only copy — next/og's built-in font has no CJK glyphs, and
 * shipping a JP font subset isn't worth it for a share card.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const c = findCountry(searchParams.get("country") ?? "");
  const r = findRole(searchParams.get("role") ?? "");
  const title = c
    ? r
      ? `${c.en} × ${r.en}`
      : `${c.en}`
    : "Global Careers";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0A1F3D 0%, #0055A4 100%)",
          color: "#FAFAF7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#FFC93C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0A1F3D",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            X
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            X BORDER HUB
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 30, color: "#9fb8d6", letterSpacing: 4 }}>
            SALARY & COST OF LIVING
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>
            {c ? `${c.flag} ` : ""}{title}
          </div>
          <div style={{ fontSize: 30, color: "#9fb8d6" }}>
            Real data from Japanese professionals abroad · 2026
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#4ECDC4", fontWeight: 700 }}>
          xbordercareer.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
