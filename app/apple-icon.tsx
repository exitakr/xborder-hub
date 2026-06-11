import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icons must be opaque — square blue tile, no transparency.
// X mark drawn with rotated bars so no font fetch is needed.
export default function AppleIcon() {
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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 104,
            height: 22,
            borderRadius: 11,
            background: "#FAFAF7",
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 104,
            height: 22,
            borderRadius: 11,
            background: "#FAFAF7",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    size,
  );
}
