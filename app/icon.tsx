import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// The X mark is drawn with two rotated bars (no glyphs) so the renderer
// never needs to fetch a font.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0055A4",
          borderRadius: 96,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 64,
            borderRadius: 32,
            background: "#FAFAF7",
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 64,
            borderRadius: 32,
            background: "#FAFAF7",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    size,
  );
}
