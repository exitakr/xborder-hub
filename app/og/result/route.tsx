import { ImageResponse } from "next/og";
import { findCountryByDb, findRoleByDb } from "@/lib/seo/salaryPages";

export const runtime = "edge";

/**
 * Share card image for the post-completion salary result. EN-only (next/og
 * has no CJK glyphs). `top` present → "TOP X%"; absent → a "new data added"
 * card that still reads well while a country×role is below the n>=5 gate.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const c = findCountryByDb(searchParams.get("country") ?? "");
  const r = findRoleByDb(searchParams.get("role") ?? "");
  const topRaw = searchParams.get("top");
  const top = topRaw && /^\d+$/.test(topRaw) ? parseInt(topRaw, 10) : null;

  const flag = c?.flag ?? "🌏";
  const countryEn = c?.en ?? "Global";
  const roleEn = r?.en ?? "Professional";

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

        {top != null ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 34, color: "#9fb8d6", letterSpacing: 3 }}>
              MY COMPENSATION IS
            </div>
            <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, color: "#FFC93C" }}>
              TOP {top}%
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8 }}>
              {flag} {countryEn} · {roleEn}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 34, color: "#9fb8d6", letterSpacing: 3 }}>
              I JUST ADDED MY DATA
            </div>
            <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
              {flag} {countryEn}
            </div>
            <div style={{ fontSize: 46, fontWeight: 700, color: "#4ECDC4" }}>
              {roleEn}
            </div>
          </div>
        )}

        <div style={{ fontSize: 24, color: "#4ECDC4", fontWeight: 700 }}>
          Real salary data from Japanese professionals abroad · xbordercareer.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
