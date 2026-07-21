import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Share card for the 準備度チェック result. EN-only (next/og has no CJK
 * glyphs). Shows the readiness score prominently to make the share pop.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scoreRaw = searchParams.get("score");
  const score = scoreRaw && /^\d+$/.test(scoreRaw) ? parseInt(scoreRaw, 10) : 0;
  const band =
    score >= 80
      ? "READY TO MOVE"
      : score >= 60
        ? "ALMOST THERE"
        : score >= 40
          ? "BUILDING UP"
          : "GETTING STARTED";

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
          background: "linear-gradient(135deg, #0A1F3D 0%, #1FA89E 100%)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 32, color: "#cfeeea", letterSpacing: 3 }}>
            GLOBAL CAREER READINESS
          </div>
          <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1, color: "#FFC93C" }}>
            {score}
            <span style={{ fontSize: 60, color: "#cfeeea" }}> / 100</span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>{band}</div>
        </div>

        <div style={{ fontSize: 24, color: "#FFE9A8", fontWeight: 700 }}>
          海外転職 準備度チェック · xbordercareer.com/check
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
