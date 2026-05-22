"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/LogoMark";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";

type Filter = "all" | "career" | "life" | "visa" | "salary" | "family";
type Sort = "new" | "popular" | "unsolved";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "🌏 すべて" },
  { id: "career", label: "💼 キャリア" },
  { id: "life", label: "🏠 生活" },
  { id: "visa", label: "🛂 ビザ" },
  { id: "salary", label: "💰 給与" },
  { id: "family", label: "👨‍👩‍👧 家族" },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "新着" },
  { id: "popular", label: "人気" },
  { id: "unsolved", label: "未解決" },
];

type Thread = {
  id: number;
  author: string;
  bg: string;
  text: string;
  location: string;
  posted: string;
  category: Filter;
  categoryLabel: string;
  title: string;
  body: string;
  ups: number;
  downs: number;
  replies: number;
};

const THREADS: Thread[] = [
  {
    id: 1,
    author: "RN",
    bg: "bg-blue",
    text: "text-cream",
    location: "SIN",
    posted: "2時間前",
    category: "career",
    categoryLabel: "💼 キャリア",
    title: "SG現地Tech企業の面接、英語だけど日本語訛りでも大丈夫?",
    body: "来月Shopee/Grabの最終面接を控えています。TOEIC900はあるけど発音はバキバキの日本語訛り。皆さんどう乗り越えました?",
    ups: 23,
    downs: 1,
    replies: 14,
  },
  {
    id: 2,
    author: "HK",
    bg: "bg-mustard",
    text: "text-ink",
    location: "SGN",
    posted: "5時間前",
    category: "family",
    categoryLabel: "👨‍👩‍👧 家族",
    title:
      "子供のインターナショナルスクール、ホーチミンで月いくらかかってますか?",
    body: "日本から移ってきたばかりで、想像の3倍くらい高くて驚いています。皆さんの実例を共有してもらえると助かります。",
    ups: 47,
    downs: 0,
    replies: 28,
  },
  {
    id: 3,
    author: "MS",
    bg: "bg-jade",
    text: "text-ink",
    location: "BKK",
    posted: "昨日",
    category: "visa",
    categoryLabel: "🛂 ビザ",
    title: "タイのSmart Visa、起業家枠の最新申請プロセス(2026年版)",
    body: "最近ルールが変わったので備忘録です。総資本金、雇用要件、ローカルパートナーの扱いなど、まとめて書きました。",
    ups: 89,
    downs: 2,
    replies: 42,
  },
  {
    id: 4,
    author: "TM",
    bg: "bg-plum",
    text: "text-cream",
    location: "TYO",
    posted: "2日前",
    category: "salary",
    categoryLabel: "💰 給与",
    title: "東京年収1,200万 vs SG SGD 11k、本当の手取り比較",
    body: "オファーをもらって悩んでいます。SGは税金安いけど家賃高い…リアルな手取りと生活費の差を計算してみました。",
    ups: 156,
    downs: 8,
    replies: 67,
  },
  {
    id: 5,
    author: "SK",
    bg: "bg-blue-soft",
    text: "text-ink",
    location: "SIN",
    posted: "3日前",
    category: "life",
    categoryLabel: "🏠 生活",
    title: "SGのコンドミニアム、家族で住むなら結局どのエリア?",
    body: "Bukit Timah、East Coast、River Valley…日本人駐在員の定番をまとめました。価格帯と通学のしやすさで分けてます。",
    ups: 72,
    downs: 3,
    replies: 31,
  },
];

export function ThreadsClient() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [voted, setVoted] = useState<Record<number, "up" | "down" | null>>({
    1: "up",
    2: "up",
    3: "up",
    4: "up",
    5: "up",
  });

  const visible = THREADS.filter(
    (t) => filter === "all" || t.category === filter,
  );

  function toggleVote(id: number, kind: "up" | "down") {
    setVoted((v) => ({ ...v, [id]: v[id] === kind ? null : kind }));
  }

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
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
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
              className="hidden lg:inline text-[12px] font-bold text-blue px-3 py-2"
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

      <main className="container-app py-6 lg:py-10 relative z-10 pb-24 lg:pb-10">
        <div className="app-grid">
          <div className="app-grid-main">
            {/* Hero */}
            <section className="mb-6 rise">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">💬</span>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                  コミュニティ
                </p>
              </div>
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <h1 className="display font-bold text-[26px] lg:text-[32px] leading-[1.15] tracking-tight text-ink">
                  みんなの
                  <span className="serif-it text-[30px] lg:text-[36px] u-blue">
                    スレッド
                  </span>
                </h1>
              </div>
            </section>

            {/* Filter chips */}
            <section className="mb-5 rise" style={{ animationDelay: "0.06s" }}>
              <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                {FILTERS.map((f) => {
                  const isActive = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={`flex-none px-3 py-1.5 border-[1.5px] border-ink rounded-full text-[12px] font-bold shadow-pop-sm whitespace-nowrap transition-colors ${
                        isActive ? "bg-ink text-cream" : "bg-cream text-ink"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Sort */}
            <section className="mb-5 flex items-center justify-between">
              <p className="text-[11px] text-ink-soft font-bold">
                {visible.length}件のスレッド
              </p>
              <div className="inline-flex gap-1 p-1 bg-paper border-[1.5px] border-ink rounded-xl shadow-pop-sm">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSort(s.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      sort === s.id ? "bg-ink text-cream" : "text-ink-soft"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Thread list */}
            <section className="space-y-3">
              {visible.map((t) => (
                <Link
                  key={t.id}
                  href={`/thread?id=${t.id}`}
                  className="thread-card"
                >
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${t.bg} ${t.text} font-bold flex items-center justify-center text-[11px] border-[1.5px] border-ink flex-shrink-0`}
                      >
                        {t.author}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[12px] text-ink">
                          {t.author} さん
                        </p>
                        <p className="text-[10px] text-ink-faint">
                          {t.location} · {t.posted}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider bg-blue-soft text-blue-deep px-2 py-0.5 rounded-full font-bold border border-blue/30 flex-shrink-0">
                      {t.categoryLabel}
                    </span>
                  </div>
                  <h3 className="display font-bold text-[15px] lg:text-[16px] text-ink leading-tight mb-1.5">
                    {t.title}
                  </h3>
                  <p className="text-[12px] text-ink-soft leading-relaxed line-clamp-2">
                    {t.body}
                  </p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-ink/15">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleVote(t.id, "up");
                      }}
                      className={`vote-btn ${voted[t.id] === "up" ? "voted-up" : ""}`}
                    >
                      👍 {t.ups + (voted[t.id] === "up" ? 0 : 0)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleVote(t.id, "down");
                      }}
                      className={`vote-btn ${voted[t.id] === "down" ? "voted-down" : ""}`}
                    >
                      👎 {t.downs}
                    </button>
                    <span className="text-[11px] text-ink-soft font-bold ml-auto">
                      💬 {t.replies}件
                    </span>
                  </div>
                </Link>
              ))}
            </section>

            <button
              type="button"
              className="mt-6 w-full py-3.5 bg-cream border-[1.5px] border-ink rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-pop-sm text-ink"
            >
              もっと見る
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      <Link href="/thread/new" className="fab" aria-label="新しいスレッドを投稿">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      <BottomNavMobile active="threads" />
    </>
  );
}
