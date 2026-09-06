import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon. A rising bar, which is the one mark that reads at 32px and says
 * "portfolio" rather than "another app".
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          background: "#0F1217",
          borderRadius: 6,
          padding: 6,
        }}
      >
        <div style={{ width: 5, height: 10, background: "#949EAB", borderRadius: 2 }} />
        <div style={{ width: 5, height: 16, background: "#589BFF", borderRadius: 2 }} />
        <div style={{ width: 5, height: 20, background: "#2DC48A", borderRadius: 2 }} />
      </div>
    ),
    size,
  );
}
