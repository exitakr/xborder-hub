import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "X Border Hub — 海外で働く前に、答え合わせができる場所";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAFAF7",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#0055A4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 36,
                height: 8,
                borderRadius: 4,
                background: "#FAFAF7",
                transform: "rotate(45deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 36,
                height: 8,
                borderRadius: 4,
                background: "#FAFAF7",
                transform: "rotate(-45deg)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#0A1F3D",
              letterSpacing: -1,
            }}
          >
            X Border Hub
          </div>
        </div>

        {/* Middle: tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#0A1F3D",
              lineHeight: 1.2,
              letterSpacing: -2,
            }}
          >
            海外で働く前に、
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#0055A4",
                lineHeight: 1.2,
                letterSpacing: -2,
              }}
            >
              答え合わせ
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#0A1F3D",
                lineHeight: 1.2,
                letterSpacing: -2,
              }}
            >
              ができる場所。
            </div>
          </div>
        </div>

        {/* Bottom: accent bar + subline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 180,
              height: 10,
              borderRadius: 999,
              background: "#0055A4",
            }}
          />
          <div
            style={{
              fontSize: 26,
              color: "#5A6B85",
              fontWeight: 600,
            }}
          >
            実年収・ビザ・生活コスト — 先に行った人が、道を残す。
          </div>
        </div>
      </div>
    ),
    size,
  );
}
