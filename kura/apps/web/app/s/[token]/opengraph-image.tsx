import { ImageResponse } from "next/og";
import { brand, formatMoney } from "@oma/core";
import { createClient } from "@/lib/supabase/server";

export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card a shared portfolio produces in a timeline.
 *
 * This is the whole share feature, in practice. Almost nobody clicks through —
 * they see the card, and the card has to make the number the entire point:
 * enormous, centred, unmissable at thumbnail size in a scrolling feed. Every
 * other element is deliberately quiet so nothing competes with it.
 *
 * Dark, because it has to hold its edges against both a light and a dark
 * timeline, and because a big number on near-black is the visual language of
 * every trading screenshot people already share.
 *
 * Contains only what the share link contains: total, gain, item count. Never a
 * name, never an item, never a photo.
 */
export default async function ShareImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_portfolio", { p_token: token });
  const snap = Array.isArray(data) ? data[0] : null;

  const total = snap ? Number(snap.total_jpy) : 0;
  const cost = snap ? Number(snap.cost_jpy) : 0;
  const gain = total - cost;
  const pct = cost > 0 ? (gain / cost) * 100 : null;
  const count = snap ? Number(snap.item_count) : 0;

  const up = gain >= 0;
  const accent = up ? "#2DC48A" : "#F85C5C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F1217",
          color: "#E8ECF1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#949EAB", letterSpacing: "0.08em" }}>
          {brand.tagline.ja}
        </div>

        {/* The number, at the size that survives a thumbnail. */}
        <div
          style={{
            fontSize: 148,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginTop: 18,
          }}
        >
          {formatMoney(total, "JPY", "ja")}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 20,
            fontSize: 44,
            fontWeight: 700,
            color: accent,
          }}
        >
          <div style={{ display: "flex" }}>{up ? "▲" : "▼"}</div>
          <div style={{ display: "flex" }}>
            {up ? "+" : ""}
            {formatMoney(gain, "JPY", "ja")}
          </div>
          {pct !== null && (
            <div style={{ display: "flex" }}>
              ({up ? "+" : ""}
              {pct.toFixed(1)}%)
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 56,
            fontSize: 26,
            color: "#949EAB",
          }}
        >
          <div style={{ display: "flex" }}>{count} 点を記録中</div>
          <div style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#2A303A" }} />
          <div style={{ display: "flex", fontWeight: 700, color: "#E8ECF1" }}>{brand.name}</div>
        </div>
      </div>
    ),
    size,
  );
}
