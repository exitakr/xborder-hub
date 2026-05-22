"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/LogoMark";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { SideNavMenu } from "@/components/site/SideNavMenu";
import { MigrationMap } from "./MigrationMap";
import {
  REGIONS,
  REGION_ORDER,
  RECENT_MOVES,
  TRENDING_THREADS,
  TRENDS,
  type RegionKey,
  type TrendKey,
} from "./data";

const TREND_TABS: { id: TrendKey; label: string }[] = [
  { id: "country", label: "国" },
  { id: "industry", label: "業界" },
  { id: "role", label: "職種" },
];

export function HomeClient() {
  const [regionKey, setRegionKey] = useState<RegionKey>("asia");
  const [trendKey, setTrendKey] = useState<TrendKey>("industry");
  const region = REGIONS[regionKey];
  const trendItems = TRENDS[trendKey];

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/10">
        <div className="container-app py-3.5 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <div className="display font-bold text-[15px] leading-none tracking-tight text-ink">
                X Border Hub
              </div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
                crossing borders
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              About
            </Link>
            <Link
              href="/home"
              className="hidden lg:inline text-[12px] font-bold text-blue px-3 py-2"
            >
              ホーム
            </Link>
            <Link
              href="/search"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              フロー検索
            </Link>
            <Link
              href="/threads"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              スレッド
            </Link>
            <Link
              href="/mypage"
              className="w-9 h-9 rounded-full bg-mustard border-[1.5px] border-ink flex items-center justify-center text-sm font-bold shadow-pop-sm text-ink"
            >
              YT
            </Link>
          </div>
        </div>
      </header>

      <main className="container-app py-5 lg:py-8 relative z-10 pb-24 lg:pb-10">
        <div className="app-grid">
          <div className="app-grid-main space-y-7">
            {/* HERO STRIP */}
            <section className="rise">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-blue font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue pulse-soft" />
                LIVE · migration map
              </div>
              <h1 className="display font-bold text-[22px] lg:text-[28px] leading-[1.15] tracking-tight text-ink mt-1.5">
                今週、
                <span className="serif-it text-[26px] lg:text-[32px] u-blue">
                  +{region.weekTotal}
                </span>{" "}
                人が新しい街へ。
              </h1>
            </section>

            {/* MAP CARD — the centerpiece */}
            <section
              className="rise"
              style={{ animationDelay: "0.05s" }}
            >
              <div className="bg-paper border-[1.5px] border-ink rounded-3xl shadow-pop relative overflow-hidden">
                {/* Region pills */}
                <div className="px-3 lg:px-4 pt-3 pb-2 border-b border-dashed border-ink/15">
                  <div className="flex gap-1.5 overflow-x-auto hide-scroll">
                    {REGION_ORDER.map((key) => {
                      const r = REGIONS[key];
                      const active = key === regionKey;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRegionKey(key)}
                          className={`flex-none px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border-[1.5px] ${
                            active
                              ? "bg-ink text-cream border-ink"
                              : "bg-cream text-ink border-ink/15"
                          }`}
                        >
                          {r.emoji} {r.tabLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map */}
                <div className="p-3 lg:p-4">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="display font-bold text-[13px] text-ink tracking-tight">
                      {region.label}
                    </p>
                    <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                      +{region.weekTotal} 今週
                    </span>
                  </div>
                  <div
                    className="bg-cream border border-ink/15 rounded-2xl p-2"
                    style={{ aspectRatio: "360/280" }}
                  >
                    <MigrationMap region={region} />
                  </div>

                  {/* Top routes — horizontal scroll */}
                  <div className="mt-3 pt-3 border-t border-dashed border-ink/15">
                    <p className="text-[9px] uppercase tracking-[0.22em] text-ink-faint font-bold mb-2">
                      今週の TOP 移動
                    </p>
                    <div className="flex gap-2 overflow-x-auto hide-scroll">
                      {region.topFlows.map((flow, i) => (
                        <div
                          key={i}
                          className="flex-none bg-cream border-[1.5px] border-ink rounded-xl px-3 py-2 shadow-pop-sm flex items-center gap-2"
                        >
                          <span
                            className="display font-bold text-[14px]"
                            style={{ color: flow.color }}
                          >
                            {flow.vol}
                          </span>
                          <span className="text-[11px] font-bold text-ink whitespace-nowrap">
                            {flow.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TRENDS */}
            <section className="rise" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                    📈 trending
                  </p>
                  <h2 className="display font-bold text-[20px] mt-1 leading-tight text-ink">
                    今、注目される
                    <span className="serif-it text-[24px] u-blue">トピック</span>
                  </h2>
                </div>
                <div className="inline-flex gap-1 p-1 bg-paper border-[1.5px] border-ink rounded-xl shadow-pop-sm">
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
                  return (
                    <Link
                      key={item.name}
                      href={`/search?industry=${encodeURIComponent(item.name)}`}
                      className="flex-none bg-cream border-[1.5px] border-ink rounded-2xl p-3 shadow-pop-sm min-w-[140px]"
                    >
                      <div className="text-2xl">{item.flag}</div>
                      <p className="display font-bold text-[14px] text-ink mt-1 leading-tight">
                        {item.name}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="display font-bold text-[18px] text-ink">
                          {item.count}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${positive ? "text-jade-deep" : "text-plum"}`}
                        >
                          {positive ? "↑" : "↓"}
                          {Math.abs(item.change)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* TRENDING THREADS */}
            <section className="rise" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                    🔥 from the community
                  </p>
                  <h2 className="display font-bold text-[20px] mt-1 leading-tight text-ink">
                    注目の
                    <span className="serif-it text-[24px] u-blue">スレッド</span>
                  </h2>
                </div>
                <Link
                  href="/threads"
                  className="text-[11px] font-bold text-blue whitespace-nowrap"
                >
                  すべて見る →
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {TRENDING_THREADS.map((t) => (
                  <Link
                    key={t.id}
                    href={`/thread?id=${t.id}`}
                    className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm hover:shadow-pop transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-wider bg-blue-soft text-blue-deep px-2 py-0.5 rounded-full font-bold border border-blue/30">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-ink-faint font-bold">
                        👍 {t.ups} · 💬 {t.replies}
                      </span>
                    </div>
                    <p className="display font-bold text-[14px] text-ink leading-tight">
                      {t.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* RECENT MOVES */}
            <section className="rise" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                    ✨ recent
                  </p>
                  <h2 className="display font-bold text-[20px] mt-1 leading-tight text-ink">
                    新着の
                    <span className="serif-it text-[24px] u-blue">動き</span>
                  </h2>
                </div>
              </div>

              <ul className="space-y-2">
                {RECENT_MOVES.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 bg-cream border-[1.5px] border-ink rounded-2xl p-3 shadow-pop-sm"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${m.bg} ${m.text} font-bold flex items-center justify-center text-[11px] border-[1.5px] border-ink flex-shrink-0`}
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

            {/* CTAs */}
            <section className="rise" style={{ animationDelay: "0.25s" }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/mypage"
                  className="bg-ink text-cream border-[1.5px] border-ink rounded-3xl p-5 shadow-pop-blue relative overflow-hidden block"
                >
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-mustard opacity-20" />
                  <div className="relative">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-mustard font-bold mb-2">
                      YOUR JOURNEY
                    </p>
                    <p className="display font-bold text-[18px] leading-tight">
                      自分の軌跡を
                      <br />
                      残す
                    </p>
                    <p className="text-[11px] opacity-80 mt-2">
                      同じ経路を歩く人と繋がる
                    </p>
                  </div>
                </Link>
                <Link
                  href="/search"
                  className="bg-paper text-ink border-[1.5px] border-ink rounded-3xl p-5 shadow-pop relative overflow-hidden block"
                >
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-blue opacity-15" />
                  <div className="relative">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-blue font-bold mb-2">
                      ASK FORWARD
                    </p>
                    <p className="display font-bold text-[18px] leading-tight">
                      先に行った人を
                      <br />
                      探す
                    </p>
                    <p className="text-[11px] text-ink-soft mt-2">
                      A → B の経路で検索
                    </p>
                  </div>
                </Link>
              </div>
            </section>
          </div>

          {/* SIDE */}
          <aside className="app-grid-side hidden lg:block space-y-4">
            <SideNavMenu active="home" />

            <div className="side-nav-card">
              <p className="text-[10px] uppercase tracking-[0.24em] text-blue font-bold mb-2">
                今週のトレンド
              </p>
              <div className="space-y-2">
                {region.topFlows.slice(0, 3).map((flow) => (
                  <div key={flow.label} className="text-[12px]">
                    <p className="font-bold text-ink flex items-center justify-between">
                      {flow.label}
                      <span className="text-jade-deep">{flow.vol}</span>
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/search"
                className="mt-3 block text-center py-2 bg-ink text-cream rounded-full font-bold text-[11px]"
              >
                フローで探す →
              </Link>
            </div>

            <div
              className="side-nav-card bg-ink text-cream"
              style={{ background: "#0A1F3D" }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-mustard font-bold mb-2">
                ✦ Premium
              </p>
              <p className="display font-bold text-[15px] leading-tight text-cream">
                給与の本当の数字を
                <br />
                見る
              </p>
              <Link
                href="/premium"
                className="mt-3 block text-center py-2 bg-mustard text-ink rounded-full font-bold text-[11px]"
              >
                無料トライアル →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <BottomNavMobile active="home" />
    </>
  );
}
