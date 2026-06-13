"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          background: "#FAFAF7",
          color: "#0A1F3D",
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 40, margin: 0 }}>🛠</p>
          <h1 style={{ fontSize: 20, margin: "12px 0 6px" }}>
            問題が発生しました
          </h1>
          <p style={{ fontSize: 13, opacity: 0.7, margin: "0 0 20px" }}>
            ご不便をおかけしています。再読み込みで直ることがあります。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#0055A4",
              color: "#fff",
              border: 0,
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </div>
      </body>
    </html>
  );
}
