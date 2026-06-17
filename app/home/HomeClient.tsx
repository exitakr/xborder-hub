"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { AppFooter } from "@/components/site/AppFooter";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { DeleteSampleButton } from "@/components/site/DeleteSampleButton";
import { GlobalMap } from "./GlobalMap";
import { SHOW_DEMO_CONTENT } from "@/lib/demo/flags";
import { dismissSample } from "@/lib/samples/actions";
import {
  ANNUAL_TOP_FLOWS,
  RECENT_MOVES,
  TRENDING_THREADS,
  TRENDS,
  type TrendKey,
  type TrendingThread,
} from "./data";

const TREND_TABS: { id: TrendKey; label: string }[] = [
  { id: "country", label: "国" },
  { id: "industry", label: "業界" },
  { id: "role", label: "職種" },
];

function formatCount(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

export function HomeClient({
  trendingThreads,
  isAdmin = false,
  dismissedKeys = [],
}: {
  trendingThreads?: TrendingThread[];
  isAdmin?: boolean;
  dismissedKeys?: string[];
} = {}) {
  const router = useRouter();
  const [trendKey, setTrendKey] = useState<TrendKey>("industry");
  const [highlightedFlow, setHighlightedFlow] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [, startDismiss] = useTransition();

  const dismissed = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);
  function hideSample(key: string) {
    startDismiss(async () => {
      await dismissSample(key);
      router.refresh();
    });
  }

  const trendItems = TRENDS[trendKey].filter(
    (item) => !dismissed.has(`trend:${trendKey}:${item.name}`),
  );

  // Trending threads come from the DB when present; otherwise the seeded
  // samples are shown to everyone. Admin-dismissed items are filtered out.
  const trending = (
    trendingThreads && trendingThreads.length > 0
      ? trendingThreads
      : TRENDING_THREADS
  ).filter((t) => !dismissed.has(`thread:${t.id}`));

  return (
    <>
      <AppTopBar active="home" />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          <div className="app-grid-main space-y-5 lg:space-y-6">
            {/* HERO — single line, same font throughout */}
            <section className="rise">
              <h1 className="display font-bold text-[22px] sm:text-[26px] lg:text-[30px] leading-[1.2] tracking-tight text-ink">
                今、誰がどこで活躍している?
              </h1>
            </section>

            {/* GLOBAL MAP */}
            <section className="rise" style={{ animationDelay: "0.04s" }}>
              <div className="bg-paper border border-ink/10 rounded-2xl shadow-pop p-2 lg:p-3">
                <GlobalMap highlightedFlow={highlightedFlow} />
              </div>
            </section>

            {/* MOVE TREND (top annual flows) */}
            <section className="rise" style={{ animationDelay: "0.08s" }}>
              <div className="flex items-end justify-between mb-2">
                <h2 className="display font-bold text-[16px] lg:text-[18px] leading-tight text-ink">
                  移動トレンド
                </h2>
                <Link
                  href="/search"
                  className="text-[11px] font-bold text-blue whitespace-nowrap"
                >
                  検索する →
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                {ANNUAL_TOP_FLOWS.map((flow) => {
                  const active =
                    highlightedFlow?.from === flow.from &&
                    highlightedFlow?.to === flow.to;
                  return (
                    <button
                      key={flow.label}
                      type="button"
                      onClick={() =>
                        setHighlightedFlow((cur) =>
                          cur?.from === flow.from && cur?.to === flow.to
                            ? null
                            : { from: flow.from, to: flow.to },
                        )
                      }
                      className={`flex-none border rounded-xl px-3 py-2 shadow-pop-sm flex items-baseline gap-2 transition-colors ${
                        active
                          ? "bg-ink text-cream border-ink"
                          : "bg-cream text-ink border-ink/10 hover:border-ink"
                      }`}
                    >
                      <span
                        className={`display font-bold text-[14px] lg:text-[15px] ${active ? "text-mustard" : ""}`}
                        style={active ? undefined : { color: flow.color }}
                      >
                        {formatCount(flow.count)}
                      </span>
                      <span className="text-[11px] font-bold whitespace-nowrap">
                        {flow.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* TRENDING CAREER (annual topic categories) */}
            <section className="rise" style={{ animationDelay: "0.12s" }}>
              <div className="flex items-end justify-between mb-2 gap-2">
                <h2 className="display font-bold text-[16px] lg:text-[18px] leading-tight text-ink">
                  トレンドキャリア
                </h2>
                <div className="inline-flex gap-1 p-1 bg-paper border border-ink/10 rounded-xl shadow-pop-sm">
                  {TREND_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTrendKey(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        trendKey === tab.id
                          ? "bg-ink text-cream"
                          : "text-ink-soft"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                {trendItems.map((item) => {
                  const positive = item.change >= 0;
                  // Map trend axis → /search query param. Country trend hits
                  // the `to` filter (destination country), the others hit
                  // their matching filter directly.
                  const param =
                    trendKey === "country"
                      ? "country"
                      : trendKey === "industry"
                        ? "industry"
                        : "role";
                  return (
                    <div key={item.name} className="relative flex-none">
                      {isAdmin && (
                        <DeleteSampleButton
                          onClick={() =>
                            hideSample(`trend:${trendKey}:${item.name}`)
                          }
                        />
                      )}
                      <Link
                        href={`/search?${param}=${encodeURIComponent(item.name)}`}
                        className="block bg-cream border border-ink/10 rounded-2xl p-3 shadow-pop-sm w-[140px] hover:border-ink transition-colors"
                      >
                        <div className="text-xl">{item.flag}</div>
                        <p className="display font-bold text-[13px] text-ink mt-1 leading-tight">
                          {item.name}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="display font-bold text-[16px] text-ink">
                            {formatCount(item.count)}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${positive ? "text-jade-deep" : "text-plum"}`}
                          >
                            {positive ? "↑" : "↓"}
                            {Math.abs(item.change)}%
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TRENDING THREADS */}
            {trending.length > 0 && (
            <section className="rise" style={{ animationDelay: "0.16s" }}>
              <div className="flex items-end justify-between mb-2">
                <h2 className="display font-bold text-[16px] lg:text-[18px] leading-tight text-ink">
                  注目のスレッド
                </h2>
                <Link
                  href="/threads"
                  className="text-[11px] font-bold text-blue whitespace-nowrap"
                >
                  すべて見る →
                </Link>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {trending.map((t) => (
                  <div key={t.id} className="relative">
                    {isAdmin && (
                      <DeleteSampleButton
                        onClick={() => hideSample(`thread:${t.id}`)}
                      />
                    )}
                    <Link
                      href={`/thread?id=${t.id}`}
                      className="block bg-cream border border-ink rounded-2xl p-3 shadow-pop-sm hover:shadow-pop transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] uppercase tracking-wider bg-blue-soft text-blue-deep px-2 py-0.5 rounded-full font-bold border border-blue/30">
                          {t.category}
                        </span>
                        <span className="text-[10px] text-ink-faint font-bold">
                          👍 {t.ups} · 💬 {t.replies}
                        </span>
                      </div>
                      <p className="display font-bold text-[13px] text-ink leading-tight">
                        {t.title}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* RECENT MOVES — sample feed, hidden until real move data exists */}
            {SHOW_DEMO_CONTENT && (
            <section className="rise" style={{ animationDelay: "0.2s" }}>
              <h2 className="display font-bold text-[16px] lg:text-[18px] leading-tight text-ink mb-2">
                新着の動き
              </h2>
              <ul className="space-y-1.5">
                {RECENT_MOVES.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 bg-cream border border-ink rounded-xl p-2.5 shadow-pop-sm"
                  >
                    <div
                      className={`w-9 h-9 rounded-full ${m.bg} ${m.text} font-bold flex items-center justify-center text-[11px] border border-ink flex-shrink-0`}
                    >
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-ink truncate flex items-center gap-1.5">
                        <span>{m.fromCity}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#0055A4"
                          strokeWidth="2.5"
                        >
                          <path d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                        <span className="text-blue">{m.toCity}</span>
                      </p>
                      <p className="text-[11px] text-ink-soft truncate">
                        {m.role}
                      </p>
                    </div>
                    <span className="text-[10px] text-ink-faint font-bold whitespace-nowrap">
                      {m.when}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            )}

            {/* CTA */}
            <section
              className="rise grid gap-2 sm:grid-cols-2"
              style={{ animationDelay: "0.24s" }}
            >
              <Link
                href="/mypage"
                className="bg-ink text-cream border border-ink rounded-2xl p-4 shadow-pop-blue relative overflow-hidden block"
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-mustard opacity-20" />
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-mustard font-bold mb-1">
                    YOUR JOURNEY
                  </p>
                  <p className="display font-bold text-[16px] leading-tight">
                    自分の軌跡を残す
                  </p>
                </div>
              </Link>
              <Link
                href="/search"
                className="bg-paper text-ink border border-ink rounded-2xl p-4 shadow-pop relative overflow-hidden block"
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-blue opacity-15" />
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-blue font-bold mb-1">
                    ASK FORWARD
                  </p>
                  <p className="display font-bold text-[16px] leading-tight">
                    先に行った人を探す
                  </p>
                </div>
              </Link>
            </section>
          </div>

          {/* Desktop side rail */}
          <aside className="app-grid-side hidden lg:block space-y-3">
            <div className="side-nav-card">
              <p className="text-[10px] uppercase tracking-[0.24em] text-blue font-bold mb-2">
                今年の TOP 経路
              </p>
              <div className="space-y-1.5">
                {ANNUAL_TOP_FLOWS.slice(0, 4).map((flow) => {
                  const active =
                    highlightedFlow?.from === flow.from &&
                    highlightedFlow?.to === flow.to;
                  return (
                    <button
                      key={flow.label}
                      type="button"
                      onClick={() =>
                        setHighlightedFlow((cur) =>
                          cur?.from === flow.from && cur?.to === flow.to
                            ? null
                            : { from: flow.from, to: flow.to },
                        )
                      }
                      className={`w-full text-[12px] font-bold flex items-center justify-between hover:text-blue transition-colors ${active ? "text-blue" : "text-ink"}`}
                    >
                      <span>{flow.label}</span>
                      <span className="text-jade-deep">
                        {formatCount(flow.count)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Link
                href="/search"
                className="mt-3 block text-center py-2 bg-ink text-cream rounded-full font-bold text-[11px]"
              >
                経路で探す →
              </Link>
            </div>

            <div
              className="side-nav-card bg-ink text-cream"
              style={{ background: "#0A1F3D" }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-mustard font-bold mb-1">
                💴 年収データ
              </p>
              <p className="display font-bold text-[14px] leading-tight text-cream">
                あなたのデータを投稿して、みんなのリアルを見る
              </p>
              <p className="text-[10px] text-cream/70 mt-1 leading-relaxed">
                匿名・レンジ値のみ。投稿すると全データが解放されます。
              </p>
              <Link
                href="/salaries"
                className="mt-2 block text-center py-1.5 bg-mustard text-ink rounded-full font-bold text-[11px]"
              >
                年収データを見る →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <AppFooter />
      <BottomNavMobile active="home" />
    </>
  );
}
