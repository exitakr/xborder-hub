import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import {
  brand,
  formatMoney,
  loadPortfolio,
  loadPortfolioSeries,
  windowSeries,
  type Range,
} from "@oma/core";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Portrait, because it is going into a feed and a phone screen is tall. */
const SIZE = { width: 1080, height: 1350 };

const RANGE_LABEL: Record<Range, string> = {
  "1w": "1週間",
  "1m": "1ヶ月",
  ytd: "年初来",
  all: "全期間",
};

/**
 * A saveable snapshot of the portfolio.
 *
 * A link is not what people share. They screenshot, and then they crop badly,
 * and the result carries whatever else was on screen. Generating the picture
 * ourselves means the thing that travels is composed on purpose: the total at
 * the size that survives a thumbnail, the shape of the move underneath it, and
 * the app's name small in the corner where it is legible but not shouting.
 *
 * Rendered server-side from the signed-in session, so the figures are the real
 * ones and no client can ask for someone else's. Nothing identifying is drawn —
 * no email, no item names, no photographs — so a saved copy carries no more
 * than the share link would.
 */
export async function GET(request: NextRequest) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const rangeParam = request.nextUrl.searchParams.get("range");
  const range: Range =
    rangeParam === "1w" || rangeParam === "ytd" || rangeParam === "all" ? rangeParam : "1m";

  const [view, series] = await Promise.all([
    loadPortfolio(supabase, profile.userId, profile.currency),
    loadPortfolioSeries(supabase, profile.userId, profile.currency),
  ]);

  if (view.holdings.length === 0) {
    return NextResponse.json({ error: "nothing to share yet" }, { status: 400 });
  }

  const shown = windowSeries(series, range);
  const totals = view.totals;
  const gain = totals.unrealized ?? 0;
  const up = gain >= 0;

  // moomoo's card is one saturated colour keyed to the direction, and that is
  // the right instinct: the reader knows whether it was a good month before
  // reading a single digit. Ours uses the app's own gain/loss tokens so the
  // card and the screen it came from cannot disagree.
  const bg = up ? "#0B7A55" : "#A32C2C";
  const bgSoft = up ? "#0E9F6E" : "#D14343";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 64px",
          background: `linear-gradient(160deg, ${bgSoft} 0%, ${bg} 100%)`,
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 10, height: 34, borderRadius: 999, background: "rgba(255,255,255,0.9)" }} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{brand.name}</div>
        </div>

        <div style={{ display: "flex", marginTop: 56, fontSize: 30, opacity: 0.85 }}>
          評価額合計
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 116,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginTop: 6,
          }}
        >
          {formatMoney(totals.totalValue, view.currency, profile.locale)}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, fontSize: 44, fontWeight: 700 }}>
          <div style={{ display: "flex" }}>{up ? "▲" : "▼"}</div>
          <div style={{ display: "flex" }}>
            {up ? "+" : ""}
            {formatMoney(gain, view.currency, profile.locale)}
          </div>
          {totals.unrealizedPct !== null && (
            <div style={{ display: "flex", opacity: 0.9 }}>
              ({up ? "+" : ""}
              {(totals.unrealizedPct * 100).toFixed(1)}%)
            </div>
          )}
        </div>

        <Chart points={shown.map((p) => p.value)} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 40,
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <Stat label="期間" value={RANGE_LABEL[range]} />
          <Stat label="銘柄数" value={String(view.holdings.length)} />
          <Stat
            label="取得額"
            value={formatMoney(totals.totalCost, view.currency, profile.locale)}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "auto",
            fontSize: 24,
            opacity: 0.75,
          }}
        >
          <div style={{ display: "flex" }}>
            {new Date().toLocaleDateString(profile.locale === "ja" ? "ja-JP" : "en-SG")}
          </div>
          <div style={{ display: "flex" }}>ohmyasset.com</div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // Personal figures. Nothing may cache this — not the browser, not a CDN.
        "Cache-Control": "no-store, private",
      },
    },
  );
}

/**
 * The value curve, drawn as columns rather than an SVG path.
 *
 * Satori (what renders this) supports only a subset of SVG, and a path that
 * silently fails to draw would ship a card with an empty space where the point
 * of the card should be. Columns are plain boxes — they cannot fail — and at
 * this size they read as the same shape.
 */
function Chart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div style={{ display: "flex", height: 300, marginTop: 48 }} />;
  }

  // Cap the column count so a year of daily points does not become hairlines.
  const step = Math.max(1, Math.ceil(points.length / 44));
  const sampled = points.filter((_, i) => i % step === 0);

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const span = max - min || max || 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height: 300,
        marginTop: 48,
      }}
    >
      {sampled.map((v, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flex: 1,
            // A floor of 8% so a flat series still shows a bar rather than a
            // row of invisible zero-height boxes.
            height: `${8 + ((v - min) / span) * 92}%`,
            borderRadius: 6,
            background: "rgba(255,255,255,0.9)",
          }}
        />
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>{label}</div>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
